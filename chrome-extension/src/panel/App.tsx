import { useEffect, useState } from 'react'
import { parseGameResult, GAME_NAMES, type ParsedResult } from '../lib/parser'
import { supabase } from '../lib/supabase'

// ── 타입 ──────────────────────────────────────────────
interface StoredUser { id: string; nickname: string }
interface PendingResult { slug: string; text: string; ts: number }
type Status = 'idle' | 'saving' | 'saved' | 'error'

const SITE_URL = 'https://wordledle-client.vercel.app'

// ── 루트 컴포넌트 ──────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<StoredUser | null | undefined>(undefined) // undefined = 로딩 중
  const [pending, setPending] = useState<PendingResult | null>(null)
  const [parsed, setParsed] = useState<ParsedResult | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    // 초기 로드
    chrome.storage.local.get(['wordledle_user', 'pending_result'], data => {
      setUser(data.wordledle_user ?? null)
      const p: PendingResult | null = data.pending_result ?? null
      setPending(p)
      if (p) setParsed(parseGameResult(p.slug, p.text))
    })

    // 스토리지 변경 감지 (로그인/로그아웃, 새 복사 이벤트)
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if ('wordledle_user' in changes) {
        setUser(changes.wordledle_user.newValue ?? null)
      }
      if ('pending_result' in changes) {
        const p: PendingResult | null = changes.pending_result.newValue ?? null
        setPending(p)
        setParsed(p ? parseGameResult(p.slug, p.text) : null)
        setStatus('idle')
      }
    }
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
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
        user_id: user.id,
        game_id: gameRow.id,
        date: today,
        raw_result: pending.text.trim(),
        score: parsed.score,
        attempts: parsed.attempts,
        max_attempts: parsed.max_attempts,
        completed: parsed.completed,
        puzzle_number: (parsed.metadata.puzzle_number as number | null) ?? null,
        metadata: parsed.metadata,
      }, { onConflict: 'user_id,game_id,date' })

      if (error) throw error
      setStatus('saved')
      // 배지 제거
      chrome.action.setBadgeText({ text: '' })
    } catch {
      setStatus('error')
    }
  }

  // 로딩 중
  if (user === undefined) return <LoadingScreen />

  // 로그인 필요
  if (!user) return <LoginScreen />

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header nickname={user.nickname} />
      <main className="flex-1 p-4">
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

// ── 서브 컴포넌트 ──────────────────────────────────────

function Header({ nickname }: { nickname?: string }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between shrink-0">
      <span className="text-sm font-black text-gray-900 tracking-tight">WORDLEDLE</span>
      {nickname && <span className="text-xs font-semibold text-gray-400">{nickname}</span>}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
      </div>
    </div>
  )
}

function LoginScreen() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-4xl">🔒</p>
        <div>
          <p className="font-bold text-gray-900">로그인이 필요해요</p>
          <p className="text-sm text-gray-500 mt-1">
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
  const games = Object.values(GAME_NAMES)
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <p className="text-4xl">📋</p>
      <div>
        <p className="font-bold text-gray-900 mb-1">결과를 복사해보세요</p>
        <p className="text-sm text-gray-500">
          지원 게임에서 결과를 복사하면<br />여기에 바로 표시됩니다
        </p>
      </div>
      <div className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">지원 게임</p>
        <ul className="space-y-2">
          {games.map(name => (
            <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
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
  const isSuccess = parsed.completed

  return (
    <div className="flex flex-col gap-3">
      {/* 결과 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">{gameName}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-2xl font-black ${isSuccess ? 'text-gray-900' : 'text-red-500'}`}>
              {parsed.score > 0 ? '+' : ''}{parsed.score}점
            </p>
            {parsed.attempts != null && (
              <p className="text-xs text-gray-400 mt-0.5">
                {parsed.attempts}{parsed.max_attempts ? `/${parsed.max_attempts}` : ''}번 시도
              </p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
          }`}>
            {isSuccess ? '클리어' : '실패'}
          </span>
        </div>
      </div>

      {/* 원문 미리보기 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">복사한 텍스트</p>
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

function SavedScreen({ parsed, slug, onDone }: { parsed: ParsedResult; slug: string; onDone: () => void }) {
  const gameName = GAME_NAMES[slug] ?? slug
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <p className="text-4xl">🎉</p>
      <div>
        <p className="text-sm font-semibold text-gray-500">{gameName}</p>
        <p className={`text-3xl font-black mt-1.5 ${parsed.completed ? 'text-gray-900' : 'text-red-500'}`}>
          {parsed.score > 0 ? '+' : ''}{parsed.score}점
        </p>
        <p className="text-sm text-gray-500 mt-1.5">WORDLEDLE에 저장됐어요!</p>
      </div>
      <button
        onClick={onDone}
        className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
      >
        확인
      </button>
    </div>
  )
}
