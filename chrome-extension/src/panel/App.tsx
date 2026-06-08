import { useEffect, useRef, useState } from 'react'
import { detectGame, GAME_NAMES, type DetectedResult } from '../lib/parser'
import { supabase } from '../lib/supabase'

// ── 타입 ──────────────────────────────────────────────
interface StoredUser { id: string; nickname: string }
type Status = 'idle' | 'saving' | 'saved' | 'error'

const SITE_URL = 'https://wordledle-client.vercel.app'

// ── 루트 ──────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState<StoredUser | null | undefined>(undefined)
  const [rawText, setRawText]     = useState('')
  const [detection, setDetection] = useState<DetectedResult | null>(null)
  const [status, setStatus]       = useState<Status>('idle')

  // 유저 스토리지 동기화
  useEffect(() => {
    chrome.storage.local.get('wordledle_user', d => setUser(d.wordledle_user ?? null))
    const listener = (changes: { [k: string]: chrome.storage.StorageChange }) => {
      if ('wordledle_user' in changes) setUser(changes.wordledle_user.newValue ?? null)
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // 텍스트 변경 시 게임 자동 감지
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

  function handleReset() {
    setRawText('')
    setStatus('idle')
  }

  if (user === undefined) return <Spinner />
  if (!user)              return <LoginScreen />

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header nickname={user.nickname} />
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {status === 'saved' ? (
          <SavedScreen detection={detection!} onReset={handleReset} />
        ) : (
          <>
            <PasteArea
              value={rawText}
              onChange={setRawText}
              hasDetection={!!detection}
              hasText={rawText.trim().length > 0}
            />
            {rawText.trim() && !detection && (
              <p className="text-xs text-center text-gray-400">인식되지 않는 형식이에요</p>
            )}
            {detection && (
              <ResultCard detection={detection} />
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
          </>
        )}
      </main>
    </div>
  )
}

// ── 컴포넌트 ──────────────────────────────────────────

function Header({ nickname }: { nickname?: string }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 h-12 flex items-center justify-between shrink-0">
      <span className="text-sm font-black tracking-tight text-gray-900">WORDLEDLE</span>
      {nickname && <span className="text-xs font-semibold text-gray-400">{nickname}</span>}
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

function PasteArea({ value, onChange, hasDetection, hasText }: {
  value: string
  onChange: (v: string) => void
  hasDetection: boolean
  hasText: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  return (
    <div className={`relative bg-white rounded-2xl border-2 transition-colors overflow-hidden ${
      hasDetection ? 'border-blue-200' : hasText ? 'border-red-100' : 'border-dashed border-gray-200'
    }`}>
      {!value && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
          <span className="text-3xl">📋</span>
          <p className="text-sm font-semibold text-gray-400">결과를 붙여넣으세요</p>
          <p className="text-xs text-gray-300">게임에서 복사 후 Ctrl+V</p>
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-36 px-4 py-3 text-xs font-mono text-gray-600 leading-relaxed resize-none bg-transparent focus:outline-none placeholder:text-transparent"
        placeholder=" "
        spellCheck={false}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  )
}

function ResultCard({ detection }: { detection: DetectedResult }) {
  const { slug, parsed } = detection
  const isOk    = parsed.completed
  const scoreStr = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className={`h-1 w-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`} />
      <div className="p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          {GAME_NAMES[slug] ?? slug}
        </p>
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
  )
}

function SavedScreen({ detection, onReset }: { detection: DetectedResult; onReset: () => void }) {
  const { slug, parsed } = detection
  const isOk    = parsed.completed
  const scoreStr = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
        isOk ? 'bg-green-50' : 'bg-red-50'
      }`}>
        {isOk ? '🎉' : '😔'}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          {GAME_NAMES[slug] ?? slug}
        </p>
        <p className={`text-4xl font-black ${isOk ? 'text-gray-900' : 'text-red-500'}`}>
          {scoreStr}
        </p>
        <p className="text-sm text-gray-500 mt-2">저장됐어요!</p>
      </div>
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
      >
        다른 결과 저장하기
      </button>
    </div>
  )
}
