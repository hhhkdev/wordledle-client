'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDailyWords, evaluateGuess, VALID_WORDS } from '@/lib/wordledle/words'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Trophy, X, RotateCcw, HelpCircle } from 'lucide-react'

const MAX_GUESSES = 10
const SITE_URL = 'https://wordledle-client.vercel.app/'
const STORAGE_KEY = 'wordledle_daily_v1'
const RULES_SEEN_KEY = 'wordledle_rules_seen_v1'

// ── 타일/키 색상 ───────────────────────────────────────
const TILE_COLORS: Record<string, string> = {
  correct: 'bg-green-500 border-green-500 text-white',
  present: 'bg-yellow-400 border-yellow-400 text-white',
  absent:  'bg-gray-500  border-gray-500  text-white',
  tbd:     'bg-white border-gray-400 text-gray-900',
  empty:   'bg-white border-gray-200 text-gray-900',
}
const KEY_COLORS: Record<string, string> = {
  correct: 'bg-green-500 text-white',
  present: 'bg-yellow-400 text-white',
  absent:  'bg-gray-400  text-white',
  unused:  'bg-gray-100  text-gray-900',
}
const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

// ── localStorage 헬퍼 ──────────────────────────────────
function kstToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

interface SavedState {
  date: string
  word1Guesses: string[]
  word2Guesses: string[]
  currentWord: 0 | 1
  gameOver: boolean
  won: boolean
}

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s: SavedState = JSON.parse(raw)
    if (s.date !== kstToday()) return null
    return s
  } catch { return null }
}

function persistState(s: Omit<SavedState, 'date'>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, date: kstToday() })) } catch {}
}

function clearSaved() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

// ── 점수 계산 ─────────────────────────────────────────
function calcScore(word1Guesses: string[], word2Guesses: string[], words: [string, string]): number {
  const solved1 = word1Guesses.some(g => g === words[0])
  const solved2 = word2Guesses.some(g => g === words[1])
  const wordScore = (solved1 ? 10 : 0) + (solved2 ? 10 : 0)
  const remaining = MAX_GUESSES - word1Guesses.length - word2Guesses.length
  const bonus = (solved1 && solved2) ? remaining : 0
  return wordScore + bonus
}

// ── 보드 ──────────────────────────────────────────────
function Board({ word, guesses, currentGuess, totalRows }: {
  word: string; guesses: string[]; currentGuess: string; totalRows: number
}) {
  const solved = guesses.some(g => g === word)
  const rows: { letters: string[]; state: string[] }[] = []

  guesses.forEach(g => rows.push({ letters: g.split(''), state: evaluateGuess(g, word) }))
  if (guesses.length < totalRows && !solved)
    rows.push({ letters: Array(5).fill('').map((_, i) => currentGuess[i] ?? ''), state: Array(5).fill('tbd') })
  while (rows.length < totalRows)
    rows.push({ letters: Array(5).fill(''), state: Array(5).fill('empty') })

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 justify-center">
          {row.letters.map((letter, ci) => {
            const state = ri < guesses.length ? row.state[ci] : (row.state[ci] === 'tbd' ? 'tbd' : 'empty')
            return (
              <div key={ci} className={cn(
                'w-12 h-12 border-2 flex items-center justify-center',
                'text-lg font-black uppercase rounded-lg transition-colors duration-300',
                TILE_COLORS[state] ?? TILE_COLORS.empty,
              )}>{letter}</div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── 키보드 ────────────────────────────────────────────
function Keyboard({ keyStates, onKey }: {
  keyStates: Record<string, 'correct' | 'present' | 'absent' | 'unused'>
  onKey: (k: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 items-center select-none">
      {KEY_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map(key => (
            <button key={key}
              onPointerDown={e => { e.preventDefault(); onKey(key) }}
              className={cn(
                'h-14 rounded-lg font-bold text-sm flex items-center justify-center',
                'transition-colors active:opacity-70',
                key === 'ENTER' || key === '⌫' ? 'px-3 min-w-13' : 'w-10',
                KEY_COLORS[keyStates[key] ?? 'unused'],
              )}
            >{key}</button>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── 규칙 설명 모달 ────────────────────────────────────
function RulesModal({ onClose }: { onClose: () => void }) {
  const EXAMPLE = [
    { letter: 'W', state: 'correct' },
    { letter: 'E', state: 'absent' },
    { letter: 'A', state: 'present' },
    { letter: 'R', state: 'absent' },
    { letter: 'Y', state: 'absent' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90dvh]">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>

        <h2 className="text-xl font-black text-gray-900 mb-1">워들들 규칙</h2>
        <p className="text-sm text-gray-500 mb-5">오늘의 5글자 영단어 2개를 맞혀보세요</p>

        <ul className="text-sm text-gray-700 space-y-2 mb-5">
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">①</span>단어 1을 먼저 맞춰야 단어 2로 넘어갑니다.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">②</span>두 단어를 합쳐 총 <strong>10번</strong> 안에 맞춰야 합니다.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">③</span>기본 10점 + 남은 시도 수만큼 보너스 점수!</li>
        </ul>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">타일 색상 의미</p>
          <div className="flex gap-1.5 mb-3">
            {EXAMPLE.map(({ letter, state }) => (
              <div key={letter} className={cn(
                'w-10 h-10 border-2 flex items-center justify-center',
                'text-base font-black uppercase rounded-lg',
                TILE_COLORS[state],
              )}>{letter}</div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500 shrink-0" />
              <span className="text-gray-700"><strong>W</strong>: 정확한 위치에 있는 글자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-400 shrink-0" />
              <span className="text-gray-700"><strong>A</strong>: 단어에 있지만 위치가 다른 글자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-500 shrink-0" />
              <span className="text-gray-700"><strong>E R Y</strong>: 단어에 없는 글자</span>
            </div>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black active:opacity-80 transition-opacity">
          게임 시작!
        </button>
      </div>
    </div>
  )
}

// ── 결과 모달 ─────────────────────────────────────────
function ResultModal({ won, words, word1Guesses, word2Guesses, onClose }: {
  won: boolean; words: [string, string]
  word1Guesses: string[]; word2Guesses: string[]; onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const solved1 = word1Guesses.some(g => g === words[0])
  const solved2 = word2Guesses.some(g => g === words[1])
  const score = calcScore(word1Guesses, word2Guesses, words)
  const total = word1Guesses.length + word2Guesses.length

  function buildShareText() {
    const date = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    const result = won ? `🎉 성공 (${total}/${MAX_GUESSES}회 · ${score}점)` : `💀 실패`
    const board = (guesses: string[], word: string) =>
      guesses.map(g => evaluateGuess(g, word).map(s =>
        s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')).join('\n')
    return `워들들 ${date}\n${result}\n\n단어 1\n${board(word1Guesses, words[0])}\n\n단어 2\n${board(word2Guesses, words[1])}\n\n${SITE_URL}`
  }

  function handleShare() {
    navigator.clipboard.writeText(buildShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>

        <div className="text-center mb-5">
          {won ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-xl font-black text-gray-900">성공!</p>
              <p className="text-sm text-gray-500 mt-1">{total}번 사용</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-1.5">
                <span className="text-yellow-600 text-sm font-black">{score}점</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">💀</div>
              <p className="text-xl font-black text-gray-900">아쉬워요</p>
              {score > 0 && <p className="text-sm text-gray-500 mt-1">{score}점 획득</p>}
            </>
          )}
        </div>

        <div className="flex gap-3 mb-5">
          {words.map((word, i) => {
            const isSolved = i === 0 ? solved1 : solved2
            const cnt = i === 0 ? word1Guesses.length : word2Guesses.length
            return (
              <div key={i} className={cn(
                'flex-1 rounded-xl p-3 text-center',
                isSolved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
              )}>
                <p className="text-xs font-bold text-gray-500 mb-1">단어 {i + 1}</p>
                <p className={cn('text-base font-black uppercase tracking-widest',
                  isSolved ? 'text-green-700' : 'text-red-500')}>{word}</p>
                {isSolved && <p className="text-xs text-green-600 mt-0.5">{cnt}번</p>}
              </div>
            )
          })}
        </div>

        <button onClick={handleShare}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black active:opacity-80 transition-opacity">
          {copied ? '✓ 복사됨!' : '결과 공유'}
        </button>
      </div>
    </div>
  )
}

// ── 메인 게임 ─────────────────────────────────────────
export default function WordledlePage() {
  const { user } = useAuth()
  const [words] = useState<[string, string]>(() => getDailyWords())

  // localStorage에서 오늘 상태 복원
  const saved = typeof window !== 'undefined' ? loadSaved() : null
  const [word1Guesses, setWord1Guesses] = useState<string[]>(saved?.word1Guesses ?? [])
  const [word2Guesses, setWord2Guesses] = useState<string[]>(saved?.word2Guesses ?? [])
  const [currentWord, setCurrentWord] = useState<0 | 1>(saved?.currentWord ?? 0)
  const [gameOver, setGameOver] = useState(saved?.gameOver ?? false)
  const [won, setWon] = useState(saved?.won ?? false)
  const [showResult, setShowResult] = useState(saved?.gameOver ?? false)
  const [currentGuess, setCurrentGuess] = useState('')
  const [shake, setShake] = useState(false)
  const [message, setMessage] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [showRules, setShowRules] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(RULES_SEEN_KEY)
  })

  const activeGuesses = currentWord === 0 ? word1Guesses : word2Guesses
  const activeWord = words[currentWord]
  const totalUsed = word1Guesses.length + word2Guesses.length
  const remaining = MAX_GUESSES - totalUsed

  // 상태 변경 시 localStorage 저장
  useEffect(() => {
    persistState({ word1Guesses, word2Guesses, currentWord, gameOver, won })
  }, [word1Guesses, word2Guesses, currentWord, gameOver, won])

  // Supabase에 결과 저장 (로그인 상태일 때만)
  async function saveResult(w1: string[], w2: string[], didWin: boolean) {
    if (!user) return
    const supabase = createClient()
    const { data: gameRow } = await supabase
      .from('games').select('id').eq('slug', 'wordledle').single()
    if (!gameRow) return
    const today = kstToday()
    const dayNum = Math.floor((new Date(today).getTime() - new Date(2026, 5, 1).getTime()) / 86400000)
    const totalGuesses = w1.length + w2.length
    const score = calcScore(w1, w2, words)
    await supabase.from('results').upsert({
      user_id: user.id,
      game_id: gameRow.id,
      date: today,
      raw_result: '',
      score,
      attempts: totalGuesses,
      max_attempts: MAX_GUESSES,
      completed: didWin,
      puzzle_number: dayNum,
      metadata: {},
    }, { onConflict: 'user_id,game_id,date' })
  }

  // Word 1 완료 → Word 2로 전환
  useEffect(() => {
    if (currentWord === 0 && word1Guesses.some(g => g === words[0]) && !transitioning && !gameOver) {
      setTransitioning(true)
      showMsg('✓ 다음 단어로!')
      setTimeout(() => { setCurrentWord(1); setCurrentGuess(''); setTransitioning(false) }, 900)
    }
  }, [word1Guesses, words, currentWord, transitioning, gameOver])

  // Word 2 완료 → 승리
  useEffect(() => {
    if (currentWord === 1 && word2Guesses.some(g => g === words[1]) && !gameOver) {
      setGameOver(true); setWon(true)
      saveResult(word1Guesses, word2Guesses, true)
      setTimeout(() => setShowResult(true), 400)
    }
  }, [word2Guesses, words, currentWord, gameOver])

  function showMsg(msg: string) { setMessage(msg); setTimeout(() => setMessage(''), 1400) }
  function triggerShake() { setShake(true); setTimeout(() => setShake(false), 500) }

  function handleAdminReset() {
    clearSaved()
    setWord1Guesses([]); setWord2Guesses([])
    setCurrentWord(0); setCurrentGuess('')
    setGameOver(false); setWon(false); setShowResult(false)
    setTransitioning(false)
  }

  const handleKey = useCallback((key: string) => {
    if (gameOver || transitioning) return
    if (key === '⌫' || key === 'BACKSPACE') { setCurrentGuess(g => g.slice(0, -1)); return }
    if (key === 'ENTER') {
      if (currentGuess.length < 5) { showMsg('5글자를 입력하세요'); triggerShake(); return }
      if (!VALID_WORDS.has(currentGuess.toLowerCase())) { showMsg('단어 목록에 없어요'); triggerShake(); return }
      const guess = currentGuess.toLowerCase()
      if (currentWord === 0) {
        const next = [...word1Guesses, guess]
        setWord1Guesses(next); setCurrentGuess('')
        if (guess !== words[0] && totalUsed + 1 >= MAX_GUESSES) {
          setGameOver(true); setWon(false)
          saveResult(next, word2Guesses, false)
          setTimeout(() => setShowResult(true), 400)
        }
      } else {
        const next = [...word2Guesses, guess]
        setWord2Guesses(next); setCurrentGuess('')
        if (guess !== words[1] && totalUsed + 1 >= MAX_GUESSES) {
          setGameOver(true); setWon(false)
          saveResult(word1Guesses, next, false)
          setTimeout(() => setShowResult(true), 400)
        }
      }
      return
    }
    if (/^[A-Z]$/.test(key) && currentGuess.length < 5)
      setCurrentGuess(g => g + key.toLowerCase())
  }, [gameOver, transitioning, currentGuess, currentWord, word1Guesses, word2Guesses, words, totalUsed])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') { handleKey('BACKSPACE'); return }
      if (e.key === 'Enter') { handleKey('ENTER'); return }
      const k = e.key.toUpperCase()
      if (/^[A-Z]$/.test(k)) handleKey(k)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  const keyStates = (() => {
    const map: Record<string, 'correct' | 'present' | 'absent' | 'unused'> = {}
    const priority: Record<string, number> = { correct: 3, present: 2, absent: 1 }
    activeGuesses.forEach(g => {
      evaluateGuess(g, activeWord).forEach((state, i) => {
        const key = g[i].toUpperCase()
        if ((priority[state] ?? 0) > (priority[map[key]] ?? 0)) map[key] = state
      })
    })
    return map
  })()

  const boardRows = currentWord === 0 ? MAX_GUESSES : MAX_GUESSES - word1Guesses.length

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-4 pb-8">
      {/* 헤더 */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">워들들</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {currentWord === 0 ? '단어 1/2' : '단어 2/2'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <HelpCircle size={20} />
          </button>
          {user?.is_admin && gameOver && (
            <button onClick={handleAdminReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-200">
              <RotateCcw size={12} />리셋
            </button>
          )}
          <div className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-black tabular-nums',
            gameOver ? 'bg-gray-100 text-gray-400' : remaining <= 3 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700',
          )}>
            남은 {remaining}회
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <div className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold',
        'transition-all duration-200 pointer-events-none',
        message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      )}>{message}</div>

      {/* Word 1 완료 배너 */}
      {currentWord === 1 && (
        <div className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-black text-sm">✓ 단어 1 완료</span>
            <span className="text-xs text-green-600">{word1Guesses.length}번</span>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-green-700">{words[0]}</span>
        </div>
      )}

      {/* 보드 */}
      <div className={cn('transition-all', shake && 'animate-shake')}>
        <Board word={activeWord} guesses={activeGuesses}
          currentGuess={currentGuess} totalRows={boardRows} />
      </div>

      {/* 키보드 */}
      <Keyboard keyStates={keyStates} onKey={handleKey} />

      {/* 결과 다시 보기 */}
      {gameOver && !showResult && (
        <button onClick={() => setShowResult(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold">
          <Trophy size={14} />결과 보기
        </button>
      )}

      {showResult && (
        <ResultModal won={won} words={words}
          word1Guesses={word1Guesses} word2Guesses={word2Guesses}
          onClose={() => setShowResult(false)} />
      )}

      {showRules && (
        <RulesModal onClose={() => {
          localStorage.setItem(RULES_SEEN_KEY, '1')
          setShowRules(false)
        }} />
      )}
    </div>
  )
}
