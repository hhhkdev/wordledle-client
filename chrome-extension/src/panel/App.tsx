import { useEffect, useState } from 'react'
import { parseGameResult, GAME_NAMES, type ParsedResult } from '../lib/parser'
import { supabase } from '../lib/supabase'

// ── 타입 ──────────────────────────────────────────────
interface StoredUser { id: string; nickname: string }
interface PendingResult { slug: string; text: string; ts: number }
type Status = 'idle' | 'saving' | 'saved' | 'error'

const SITE_URL = 'https://wordledle-client.vercel.app'

// ── 루트 ──────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState<StoredUser | null | undefined>(undefined)
  const [pending, setPending] = useState<PendingResult | null>(null)
  const [parsed, setParsed]   = useState<ParsedResult | null>(null)
  const [status, setStatus]   = useState<Status>('idle')

  useEffect(() => {
    chrome.storage.local.get(['wordledle_user', 'pending_result'], data => {
      setUser(data.wordledle_user ?? null)
      const p: PendingResult | null = data.pending_result ?? null
      setPending(p)
      if (p) setParsed(parseGameResult(p.slug, p.text))
    })

    const listener = (changes: { [k: string]: chrome.storage.StorageChange }) => {
      if ('wordledle_user' in changes)
        setUser(changes.wordledle_user.newValue ?? null)
      if ('pending_result' in changes) {
        const p: PendingResult | null = changes.pending_result.newValue ?? null
        setPending(p)
        setParsed(p ? parseGameResult(p.slug, p.text) : null)
        setStatus('idle')
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  async function handleSave() {
    if (!user || !pending || !parsed) return
    setStatus('saving')
    try {
      const { data: gameRow, error: gameErr } = await supabase
        .from('games').select('id').eq('slug', pending.slug).single()
      if (gameErr || !gameRow) throw new Error()

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
      const { error } = await supabase.from('results').upsert({
        user_id:       user.id,
        game_id:       gameRow.id,
        date:          today,
        raw_result:    pending.text.trim(),
        score:         parsed.score,
        attempts:      parsed.attempts,
        max_attempts:  parsed.max_attempts,
        completed:     parsed.completed,
        puzzle_number: (parsed.metadata.puzzle_number as number | null) ?? null,
        metadata:      parsed.metadata,
      }, { onConflict: 'user_id,game_id,date' })

      if (error) throw error
      setStatus('saved')
      chrome.storage.local.remove('pending_result')
      chrome.action.setBadgeText({ text: '' })
    } catch {
      setStatus('error')
    }
  }

  if (user === undefined) return <Spinner />
  if (!user) return <LoginScreen />

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header nickname={user.nickname} />
      <main className="flex-1 overflow-y-auto p-4">
        {status === 'saved' ? (
          <SavedScreen parsed={parsed!} slug={pending!.slug} onDone={() => setStatus('idle')} />
        ) : !pending || !parsed ? (
          <EmptyScreen />
        ) : (
          <ResultScreen
            slug={pending.slug}
            rawText={pending.text}
            parsed={parsed}
            status={status}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  )
}

// ── 공통 컴포넌트 ──────────────────────────────────────

function Header({ nickname }: { nickname?: string }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between shrink-0">
      <span className="text-sm font-black tracking-tight text-gray-900">WORDLEDLE</span>
      {nickname && (
        <span className="text-xs font-semibold text-gray-400">{nickname}</span>
      )}
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
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">🔒</div>
        <div>
          <p className="font-black text-gray-900 text-base">로그인이 필요해요</p>
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

function EmptyScreen() {
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">📋</div>
      <div>
        <p className="font-black text-gray-900 mb-1">결과를 복사해보세요</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          지원 게임에서 결과를 복사하면<br />자동으로 표시됩니다
        </p>
      </div>
      {/* 지원 게임 카드 */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">지원 게임</p>
        <ul className="space-y-2.5">
          {Object.values(GAME_NAMES).map(name => (
            <li key={name} className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ResultScreen({ slug, rawText, parsed, status, onSave }: {
  slug: string
  rawText: string
  parsed: ParsedResult
  status: Status
  onSave: () => void
}) {
  const gameName = GAME_NAMES[slug] ?? slug
  const isOk     = parsed.completed
  const scoreStr = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`

  return (
    <div className="flex flex-col gap-3">
      {/* 결과 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* 컬러 바 */}
        <div className={`h-1.5 w-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`} />
        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{gameName}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-black ${isOk ? 'text-gray-900' : 'text-red-500'}`}>
                {scoreStr}
              </p>
              {parsed.attempts != null && (
                <p className="text-xs text-gray-400 mt-1">
                  {parsed.attempts}{parsed.max_attempts ? `/${parsed.max_attempts}` : ''}번 시도
                </p>
              )}
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              isOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
            }`}>
              {isOk ? '클리어' : '실패'}
            </span>
          </div>
        </div>
      </div>

      {/* 원문 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">복사한 텍스트</p>
        <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap break-all line-clamp-8">
          {rawText.trim()}
        </p>
      </div>

      <button
        onClick={onSave}
        disabled={status === 'saving'}
        className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black disabled:opacity-50 active:opacity-80 transition-opacity"
      >
        {status === 'saving' ? '저장 중...' : '저장하기'}
      </button>

      {status === 'error' && (
        <p className="text-xs text-center text-red-500">저장에 실패했어요. 다시 시도해주세요.</p>
      )}
    </div>
  )
}

function SavedScreen({ parsed, slug, onDone }: {
  parsed: ParsedResult
  slug: string
  onDone: () => void
}) {
  const isOk     = parsed.completed
  const scoreStr = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
        isOk ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {isOk ? '🎉' : '😔'}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          {GAME_NAMES[slug] ?? slug}
        </p>
        <p className={`text-4xl font-black ${isOk ? 'text-gray-900' : 'text-red-500'}`}>
          {scoreStr}
        </p>
        <p className="text-sm text-gray-500 mt-2">WORDLEDLE에 저장됐어요!</p>
      </div>
      <button
        onClick={onDone}
        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
      >
        확인
      </button>
    </div>
  )
}
