import { useEffect, useRef, useState } from 'react'
import { detectGame, type DetectedResult, type ParsedResult } from '../lib/parser'
import { GAMES, type GameInfo } from '../lib/games'
import { supabase } from '../lib/supabase'

// ── 타입 ──────────────────────────────────────────────
interface StoredUser { id: string; nickname: string }
interface GameResult { score: number; completed: boolean }
type Status = 'idle' | 'saving' | 'saved' | 'error'

const SITE_URL = 'https://wordledle-client.vercel.app'

function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

// ── Supabase ──────────────────────────────────────────
async function fetchGames(): Promise<GameInfo[]> {
  const { data } = await supabase
    .from('games')
    .select('slug, name, url, color')
    .order('name')
  if (!data || data.length === 0) return GAMES
  // GAMES 순서를 기준으로 정렬 (DB에 없는 항목은 뒤로)
  const slugOrder = GAMES.map(g => g.slug)
  return (data as GameInfo[]).sort((a, b) => {
    const ai = slugOrder.indexOf(a.slug)
    const bi = slugOrder.indexOf(b.slug)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

async function fetchTodayResults(userId: string): Promise<Record<string, GameResult>> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  const { data } = await supabase
    .from('results')
    .select('score, completed, games(slug)')
    .eq('user_id', userId)
    .eq('date', today)

  if (!data) return {}
  const map: Record<string, GameResult> = {}
  for (const row of data as unknown as { score: number; completed: boolean; games: { slug: string } | null }[]) {
    const slug = row.games?.slug
    if (slug) map[slug] = { score: row.score, completed: row.completed }
  }
  return map
}

// ── 루트 ──────────────────────────────────────────────
export default function App() {
  const [user, setUser]            = useState<StoredUser | null | undefined>(undefined)
  const [games, setGames]          = useState<GameInfo[]>(GAMES)
  const [todayResults, setResults] = useState<Record<string, GameResult>>({})
  const [rawText, setRawText]      = useState('')
  const [detection, setDetection]  = useState<DetectedResult | null>(null)
  const [status, setStatus]        = useState<Status>('idle')

  useEffect(() => {
    fetchGames().then(setGames)
  }, [])

  useEffect(() => {
    chrome.storage.local.get('wordledle_user', d => setUser(d.wordledle_user ?? null))
    const listener = (changes: { [k: string]: chrome.storage.StorageChange }) => {
      if ('wordledle_user' in changes) setUser(changes.wordledle_user.newValue ?? null)
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  useEffect(() => {
    if (!user) { setResults({}); return }
    fetchTodayResults(user.id).then(setResults)
  }, [user])

  useEffect(() => {
    if (status === 'saved' && user) fetchTodayResults(user.id).then(setResults)
  }, [status, user])

  useEffect(() => {
    setDetection(rawText.trim() ? detectGame(rawText) : null)
    setStatus('idle')
  }, [rawText])

  async function handleSave() {
    if (!user || !detection) return
    setStatus('saving')
    try {
      const { slug, parsed } = detection
      const { data: gameRow, error: gameErr } = await supabase
        .from('games').select('id').eq('slug', slug).single()
      if (gameErr || !gameRow) throw new Error()

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
      const { error } = await supabase.from('results').upsert({
        user_id:       user.id,
        game_id:       gameRow.id,
        date:          today,
        raw_result:    rawText.trim(),
        score:         parsed.score,
        attempts:      parsed.attempts,
        max_attempts:  parsed.max_attempts,
        completed:     parsed.completed,
        puzzle_number: (parsed.metadata.puzzle_number as number | null) ?? null,
        metadata:      parsed.metadata,
      }, { onConflict: 'user_id,game_id,date' })

      if (error) throw error
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  if (user === undefined) return <Spinner />
  if (!user)              return <LoginScreen />

  // 완료 → 감지된 게임 → 나머지 순서로 정렬
  const sortedGames = [...games].sort((a, b) => {
    const aComp = todayResults[a.slug]?.completed === true
    const bComp = todayResults[b.slug]?.completed === true
    if (aComp && !bComp) return -1
    if (!aComp && bComp) return 1
    if (!aComp && !bComp) {
      const aDet = detection?.slug === a.slug
      const bDet = detection?.slug === b.slug
      if (aDet && !bDet) return -1
      if (!aDet && bDet) return 1
    }
    return 0
  })

  const completedCount = games.filter(g => todayResults[g.slug]?.completed).length

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header nickname={user.nickname} completed={completedCount} total={games.length} />

      <main className="flex-1 overflow-y-auto">
        {/* ① 결과 입력 */}
        <section className="p-3 pb-2">
          {status === 'saved' ? (
            <SavedScreen
              detection={detection!}
              games={games}
              onReset={() => { setRawText(''); setStatus('idle') }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <PasteArea
                value={rawText}
                onChange={setRawText}
                hasDetection={!!detection}
                hasText={rawText.trim().length > 0}
                onSubmit={detection ? handleSave : undefined}
              />
              {rawText.trim() && !detection && (
                <p className="text-xs text-center text-gray-400">인식되지 않는 형식이에요</p>
              )}
              {detection && (
                <button
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black disabled:opacity-50 active:opacity-80 transition-opacity"
                >
                  {status === 'saving' ? '저장 중...' : '저장하기'}
                </button>
              )}
              {status === 'error' && (
                <p className="text-xs text-center text-red-500">저장에 실패했어요. 다시 시도해주세요.</p>
              )}
            </div>
          )}
        </section>

        {/* 구분선 */}
        <div className="mx-3 border-t border-gray-100" />

        {/* ② 오늘의 게임 */}
        <section className="p-3 pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-0.5">
            오늘의 게임
          </p>
          <div className="flex flex-col gap-2">
            {sortedGames.map(game => (
              <GameCard
                key={game.slug}
                game={game}
                result={todayResults[game.slug]}
                detectedParsed={
                  status !== 'saved' && detection?.slug === game.slug
                    ? detection.parsed
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

// ── 헤더 ─────────────────────────────────────────────

function Header({ nickname, completed, total }: { nickname: string; completed: number; total: number }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between shrink-0">
      <button
        onClick={() => chrome.tabs.create({ url: SITE_URL })}
        className="text-sm font-black tracking-tight text-gray-900 hover:opacity-70 transition-opacity"
      >
        WORDLEDLE
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">
          <span className="font-black text-gray-700">{completed}</span>/{total} 완료
        </span>
        <span className="w-px h-3 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400">{nickname}</span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
    </div>
  )
}

function LoginScreen() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between shrink-0">
        <button
          onClick={() => chrome.tabs.create({ url: SITE_URL })}
          className="text-sm font-black tracking-tight text-gray-900 hover:opacity-70 transition-opacity"
        >
          WORDLEDLE
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">🔒</div>
        <div>
          <p className="font-black text-gray-900">로그인이 필요해요</p>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            WORDLEDLE 사이트에 로그인하면<br />자동으로 연결됩니다
          </p>
        </div>
        <button
          onClick={() => chrome.tabs.create({ url: SITE_URL })}
          className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold"
        >
          사이트 열기
        </button>
      </div>
    </div>
  )
}

// ── 붙여넣기 영역 ─────────────────────────────────────

function PasteArea({ value, onChange, hasDetection, hasText, onSubmit }: {
  value: string; onChange: (v: string) => void
  hasDetection: boolean; hasText: boolean
  onSubmit?: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // textarea 높이를 내용에 맞게 자동 조절
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.max(96, el.scrollHeight) + 'px'
  }, [value])

  const borderColor = hasDetection
    ? 'border-blue-300 bg-blue-50/40'
    : hasText
      ? 'border-red-200 bg-white'
      : 'border-blue-200 bg-blue-50/60'

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && hasDetection && onSubmit) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      className={`relative rounded-2xl border-2 transition-colors overflow-hidden cursor-text ${borderColor}`}
      onClick={() => ref.current?.focus()}
    >
      {!value && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📋</div>
          <div className="text-center">
            <p className="text-sm font-bold text-blue-600">결과를 붙여넣으세요</p>
            <p className="text-[11px] text-blue-400 mt-0.5">클릭 후 Ctrl+V</p>
          </div>
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2.5 text-xs font-mono text-gray-600 leading-relaxed resize-none bg-transparent focus:outline-none"
        style={{ minHeight: 96 }}
        placeholder=" "
        spellCheck={false}
      />
      {value && (
        <button
          onClick={e => { e.stopPropagation(); onChange('') }}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 text-[10px] font-bold"
        >✕</button>
      )}
    </div>
  )
}

// ── 게임 카드 ────────────────────────────────────────

function GameCard({ game, result, detectedParsed }: {
  game: GameInfo
  result?: GameResult
  detectedParsed?: ParsedResult
}) {
  const hasResult    = result !== undefined
  const isCompleted  = result?.completed === true
  const isPreview    = !hasResult && detectedParsed !== undefined
  const light        = isLightColor(game.color)
  const textOn       = light ? 'text-gray-900' : 'text-white'
  const subOn        = light ? 'text-gray-600' : 'text-white/70'

  // 표시할 점수: 실제 결과 > 예상 점수 > 없음
  const displayScore    = hasResult ? result!.score : isPreview ? detectedParsed!.score : null
  const displayComplete = hasResult ? isCompleted    : isPreview ? detectedParsed!.completed : null

  const card = (
    <div className={`rounded-2xl overflow-hidden border transition-all ${
      isPreview
        ? 'border-blue-300 ring-2 ring-blue-200/60'
        : 'border-gray-100'
    } ${game.url ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}>
      {/* 상단: 점수 영역 */}
      <div className="h-[68px] flex items-center justify-center bg-white">
        {displayScore !== null ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className={`text-2xl font-black leading-none ${displayComplete ? (isPreview ? 'text-blue-600' : 'text-gray-900') : 'text-red-500'}`}>
              {(displayScore > 0 ? '+' : '') + displayScore}점
            </span>
            <span className={`text-[11px] font-semibold ${displayComplete ? (isPreview ? 'text-blue-400' : 'text-gray-400') : 'text-red-400'}`}>
              {isPreview ? '예상' : (displayComplete ? '클리어' : '실패')}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-gray-300">미완료</span>
        )}
      </div>

      {/* 하단: 게임명 바 */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: (hasResult || isPreview) ? game.color : game.color + 'cc' }}
      >
        <p className={`text-sm font-black truncate ${textOn}`}>{game.name}</p>
        {game.url && (
          <span className={`text-xs font-semibold shrink-0 ml-2 ${subOn}`}>
            {hasResult ? '재도전 →' : isPreview ? '바로가기 →' : '→'}
          </span>
        )}
        {!game.url && (
          <span className={`text-[10px] shrink-0 ml-2 ${subOn}`}>입력 전용</span>
        )}
      </div>
    </div>
  )

  if (game.url) {
    return <a href={game.url} target="_blank" rel="noopener noreferrer">{card}</a>
  }
  return card
}

// ── 완료 화면 ─────────────────────────────────────────

function SavedScreen({ detection, games, onReset }: {
  detection: DetectedResult
  games: GameInfo[]
  onReset: () => void
}) {
  const { slug, parsed } = detection
  const game = games.find(g => g.slug === slug)
  const isOk = parsed.completed

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
        isOk ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {isOk ? '🎉' : '😔'}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{game?.name ?? slug}</p>
        <p className={`text-3xl font-black mt-1 ${isOk ? 'text-gray-900' : 'text-red-500'}`}>
          {parsed.score > 0 ? '+' : ''}{parsed.score}점
        </p>
        <p className="text-xs text-gray-500 mt-1">저장됐어요!</p>
      </div>
      <button onClick={onReset} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold">
        다른 결과 저장하기
      </button>
    </div>
  )
}
