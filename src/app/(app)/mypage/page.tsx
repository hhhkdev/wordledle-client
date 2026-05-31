'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult } from '@/types'
import { CheckCircle2, XCircle, Minus, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

// ── 타입 ─────────────────────────────────────────────────────
interface DailyRecord {
  date: string
  results: (GameResult & { game: Game })[]
  completedCount: number
  totalScore: number
}

interface GameStat {
  game: Game
  totalPlayed: number
  totalCompleted: number
  avgAttempts: number | null
  bestAttempts: number | null
  currentStreak: number
}

// ── 헬퍼 ─────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function getRecentDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
}

function calcStreak(dates: string[], completedDates: Set<string>): number {
  let streak = 0
  for (const d of dates) {
    if (completedDates.has(d)) streak++
    else break
  }
  return streak
}

// ── 컴포넌트 ──────────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter()
  const { user, loading: authLoading, login: setUser } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [allResults, setAllResults] = useState<(GameResult & { game: Game })[]>([])
  const [loading, setLoading] = useState(true)

  // 닉네임 변경 상태
  const [editingNick, setEditingNick] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [nickError, setNickError] = useState('')
  const [nickLoading, setNickLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    async function load() {
      const supabase = createClient()
      const [{ data: gamesData }, { data: resultsData }] = await Promise.all([
        supabase.from('games').select('*').order('name'),
        supabase
          .from('results')
          .select('*, game:games(*)')
          .eq('user_id', user!.id)
          .order('date', { ascending: false }),
      ])
      if (gamesData) setGames(gamesData as Game[])
      if (resultsData) setAllResults(resultsData as (GameResult & { game: Game })[])
      setLoading(false)
    }
    load()
  }, [user])

  // 날짜별 그루핑 (최근 30일)
  const recentDates = getRecentDates(30)
  const byDate = new Map<string, (GameResult & { game: Game })[]>()
  for (const r of allResults) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r)
  }
  const dailyRecords: DailyRecord[] = recentDates
    .filter(d => byDate.has(d))
    .map(d => {
      const results = byDate.get(d)!
      return {
        date: d,
        results,
        completedCount: results.filter(r => r.completed).length,
        totalScore: results.reduce((s, r) => s + (r.score ?? 0), 0),
      }
    })

  // 게임별 통계
  const gameStats: GameStat[] = games.map(game => {
    const rs = allResults.filter(r => r.game_id === game.id)
    const completed = rs.filter(r => r.completed)
    const attempts = completed.filter(r => r.attempts !== null).map(r => r.attempts!)

    // 연속 완료 일수
    const completedDates = new Set(completed.map(r => r.date))
    const streak = calcStreak(recentDates, completedDates)

    return {
      game,
      totalPlayed: rs.length,
      totalCompleted: completed.length,
      avgAttempts: attempts.length ? Math.round((attempts.reduce((a, b) => a + b, 0) / attempts.length) * 10) / 10 : null,
      bestAttempts: attempts.length ? Math.min(...attempts) : null,
      currentStreak: streak,
    }
  })

  // 오늘 현황
  const today = new Date().toISOString().slice(0, 10)
  const todayResults = byDate.get(today) ?? []
  const todayCompleted = todayResults.filter(r => r.completed).length

  // 닉네임 변경
  async function handleNicknameChange(e: FormEvent) {
    e.preventDefault()
    if (!user || !newNickname.trim()) return
    if (newNickname.trim() === user.nickname) { setEditingNick(false); return }
    if (newNickname.trim().length < 2 || newNickname.trim().length > 16) {
      setNickError('닉네임은 2~16자여야 합니다.')
      return
    }

    setNickLoading(true)
    setNickError('')
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('users').select('id').eq('nickname', newNickname.trim()).single()
    if (existing) {
      setNickError('이미 사용 중인 닉네임입니다.')
      setNickLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('users').update({ nickname: newNickname.trim() }).eq('id', user.id)
      .select('id, nickname, created_at').single()

    setNickLoading(false)
    if (error || !data) { setNickError('변경에 실패했습니다.'); return }
    setUser(data as typeof user)
    setEditingNick(false)
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">내 프로필</p>
            {editingNick ? (
              <form onSubmit={handleNicknameChange} className="flex items-start gap-2 mt-1">
                <div>
                  <Input
                    value={newNickname}
                    onChange={e => { setNewNickname(e.target.value); setNickError('') }}
                    placeholder={user.nickname}
                    error={nickError}
                    autoFocus
                    className="text-xl font-black h-10"
                  />
                </div>
                <div className="flex gap-1 mt-0.5">
                  <Button type="submit" size="sm" loading={nickLoading} className="bg-gray-900! hover:bg-gray-700!">
                    <Check size={14} />
                  </Button>
                  <Button type="button" size="sm" variant="secondary"
                    onClick={() => { setEditingNick(false); setNickError('') }}>
                    <X size={14} />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900">{user.nickname}</h1>
                <button
                  onClick={() => { setNewNickname(user.nickname); setEditingNick(true) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="닉네임 변경"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 가입
            </p>
          </div>

          {/* 오늘 완료 현황 */}
          <div className="text-center bg-gray-50 rounded-2xl px-6 py-4">
            <p className="text-3xl font-black text-gray-900">
              {todayCompleted}
              <span className="text-xl text-gray-300 font-bold">/{games.length}</span>
            </p>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">오늘 완료</p>
          </div>
        </div>
      </div>

      {/* 게임별 통계 */}
      <section className="mb-5">
        <h2 className="text-lg font-black text-gray-900 mb-3">게임별 통계</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameStats.map(stat => (
              <div
                key={stat.game.id}
                className="bg-white rounded-2xl border border-gray-200 p-4"
              >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{stat.game.emoji}</span>
                    <span className="text-sm font-bold text-gray-900">{stat.game.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem label="완료" value={`${stat.totalCompleted}회`} />
                    <StatItem
                      label="완료율"
                      value={stat.totalPlayed ? `${Math.round(stat.totalCompleted / stat.totalPlayed * 100)}%` : '-'}
                    />
                    <StatItem
                      label={stat.game.slug === 'kkomanttle' ? '평균 추측' : '평균 시도'}
                      value={stat.avgAttempts !== null ? `${stat.avgAttempts}회` : '-'}
                    />
                    <StatItem
                      label="연속"
                      value={stat.currentStreak > 0 ? `🔥${stat.currentStreak}일` : '-'}
                    />
                  </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 날짜별 기록 */}
      <section>
        <h2 className="text-lg font-black text-gray-900 mb-3">최근 기록</h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : dailyRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm font-semibold">아직 기록이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dailyRecords.map(record => (
              <DailyRecordRow key={record.date} record={record} games={games} isToday={record.date === today} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-black text-gray-900">{value}</p>
    </div>
  )
}

function DailyRecordRow({ record, games, isToday }: { record: DailyRecord; games: Game[]; isToday: boolean }) {
  const [open, setOpen] = useState(isToday)

  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden transition-all',
      isToday ? 'border-gray-300' : 'border-gray-200'
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">{formatDate(record.date)}</span>
          {isToday && (
            <span className="text-xs font-semibold bg-gray-900 text-white px-2 py-0.5 rounded-full">오늘</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 게임별 완료 dot */}
          <div className="flex items-center gap-1">
            {games.map(game => {
              const r = record.results.find(r => r.game_id === game.id)
              return (
                <div
                  key={game.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: r ? game.color + '33' : '#f3f4f6' }}
                  title={game.name}
                >
                  {r?.completed ? (
                    <CheckCircle2 size={12} style={{ color: game.color }} />
                  ) : r ? (
                    <XCircle size={12} className="text-red-400" />
                  ) : (
                    <Minus size={10} className="text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
          <span className="text-xs font-bold text-gray-500">
            {record.completedCount}/{games.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          {record.results.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{r.game?.emoji}</span>
                <span className="font-semibold text-gray-700">{r.game?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {r.completed ? (
                  <>
                    {r.attempts !== null && (
                      <span className="text-xs text-gray-500">
                        {r.attempts}{r.max_attempts ? `/${r.max_attempts}` : ''}회
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-900">{r.score}점</span>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </>
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
