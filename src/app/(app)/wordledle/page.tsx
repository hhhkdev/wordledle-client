'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDailyWords, evaluateGuess, VALID_WORDS } from '@/lib/wordledle/words'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { kstToday } from '@/lib/date'
import { Trophy, RotateCcw, HelpCircle } from 'lucide-react'
import Board from './_components/Board'
import Keyboard from './_components/Keyboard'
import RulesModal from './_components/RulesModal'
import GameResultModal, { calcScore } from './_components/GameResultModal'

const MAX_GUESSES = 10
const STORAGE_KEY = 'wordledle_daily_v1'
const RULES_SEEN_KEY = 'wordledle_rules_seen_v1'

// ── localStorage 헬퍼 ──────────────────────────────────
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
  // 다른 기기/세션에서 이미 플레이한 경우 서버 결과 (로컬 상태 없을 때만)
  const [serverResult, setServerResult] = useState<{ score: number; completed: boolean } | null>(null)

  const activeGuesses = currentWord === 0 ? word1Guesses : word2Guesses
  const activeWord = words[currentWord]
  const totalUsed = word1Guesses.length + word2Guesses.length
  const remaining = MAX_GUESSES - totalUsed

  // 상태 변경 시 localStorage 저장
  useEffect(() => {
    persistState({ word1Guesses, word2Guesses, currentWord, gameOver, won })
  }, [word1Guesses, word2Guesses, currentWord, gameOver, won])

  // 로그인 상태이고 로컬 기록이 없을 때 서버에서 오늘 결과 확인 (계정 기반 중복 방지)
  useEffect(() => {
    if (!user) return
    const s = loadSaved()
    if (s?.gameOver) return // 이미 로컬에 오늘 게임 완료 기록 있음
    const check = async () => {
      const supabase = createClient()
      const { data: gameRow } = await supabase.from('games').select('id').eq('slug', 'wordledle').single()
      if (!gameRow) return
      const { data } = await supabase.from('results')
        .select('score, completed')
        .eq('user_id', user.id)
        .eq('game_id', gameRow.id)
        .eq('date', kstToday())
        .single()
      if (data) {
        setServerResult({ score: data.score, completed: data.completed })
        setGameOver(true)
      }
    }
    check()
  }, [user])

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
    const score = calcScore(w1, w2, words, didWin)
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

  // 다른 세션에서 이미 플레이 (로컬 기록 없음)
  const alreadyPlayedRemotely = serverResult !== null && word1Guesses.length === 0 && word2Guesses.length === 0

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-4 pb-56">
      {/* 헤더 */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">워들들</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {alreadyPlayedRemotely ? '오늘 완료' : currentWord === 0 ? '단어 1/2' : '단어 2/2'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowRules(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <HelpCircle size={20} />
          </button>
          {user?.is_admin && gameOver && !alreadyPlayedRemotely && (
            <button onClick={handleAdminReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-200">
              <RotateCcw size={12} />리셋
            </button>
          )}
          {!alreadyPlayedRemotely && (
            <div className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-black tabular-nums',
              gameOver ? 'bg-gray-100 text-gray-400' : remaining <= 3 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-700',
            )}>
              남은 {remaining}회
            </div>
          )}
        </div>
      </div>

      {/* 토스트 */}
      <div className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold',
        'transition-all duration-200 pointer-events-none',
        message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      )}>{message}</div>

      {alreadyPlayedRemotely ? (
        /* ── 다른 기기에서 이미 플레이한 경우 ── */
        <div className="w-full flex flex-col items-center gap-5 py-12 text-center">
          <p className="text-5xl">✅</p>
          <div>
            <p className="text-xl font-black text-gray-900">오늘은 이미 플레이했어요</p>
            <p className="text-sm text-gray-500 mt-1">내일 새로운 단어로 다시 도전해요!</p>
          </div>
          <div className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-5 py-2 border',
            serverResult.completed ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
          )}>
            <span className={cn('text-lg font-black', serverResult.completed ? 'text-yellow-600' : 'text-red-400')}>
              {serverResult.score > 0 ? '+' : ''}{serverResult.score}점
            </span>
          </div>
        </div>
      ) : (
        /* ── 일반 게임 화면 ── */
        <>
          {/* Word 1 완료 배너 */}
          {currentWord === 1 && (
            <div className="w-full flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-black text-sm">✓ 단어 1 완료</span>
                <span className="text-xs text-green-600">{word1Guesses.length}번</span>
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-green-700 font-game">{words[0]}</span>
            </div>
          )}

          {/* 보드 */}
          <div className={cn('transition-all', shake && 'animate-shake')}>
            <Board word={activeWord} guesses={activeGuesses}
              currentGuess={currentGuess} totalRows={boardRows} />
          </div>

          {/* 결과 다시 보기 */}
          {gameOver && !showResult && (
            <button onClick={() => setShowResult(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold">
              <Trophy size={14} />결과 보기
            </button>
          )}
        </>
      )}

      {/* 키보드 — 하단 고정 (게임 중일 때만) */}
      {!alreadyPlayedRemotely && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 pt-2 pb-6">
          <div className="max-w-lg mx-auto px-2 sm:px-4">
            <Keyboard keyStates={keyStates} onKey={handleKey} />
          </div>
        </div>
      )}

      {showResult && (
        <GameResultModal won={won} words={words}
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
