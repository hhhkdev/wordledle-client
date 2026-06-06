'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import { CheckCircle2, XCircle, Minus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  totalScore: number
  avgAttempts: number | null
  bestAttempts: number | null
  currentStreak: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  })
}

function getKSTDate(offsetDays = 0): string {
  return new Date(Date.now() - offsetDays * 86400000)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function getRecentDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => getKSTDate(i))
}

function calcStreak(dates: string[], completedDates: Set<string>): number {
  let streak = 0
  for (const d of dates) {
    if (completedDates.has(d)) streak++
    else break
  }
  return streak
}

export default function UserProfilePage() {
  const { nickname } = useParams<{ nickname: string }>()
  const { user: me } = useAuth()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [allResults, setAllResults] = useState<(GameResult & { game: Game })[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const decodedNickname = decodeURIComponent(nickname)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: userData }, { data: gamesData }] = await Promise.all([
        supabase.from('users').select('id, nickname, created_at').eq('nickname', decodedNickname).single(),
        supabase.from('games').select('*').order('name'),
      ])

      if (!userData) { setNotFound(true); setLoading(false); return }
      setProfileUser(userData as User)
      if (gamesData) setGames(gamesData as Game[])

      const { data: resultsData } = await supabase
        .from('results')
        .select('*, game:games(*)')
        .eq('user_id', userData.id)
        .order('date', { ascending: false })

      if (resultsData) setAllResults(resultsData as (GameResult & { game: Game })[])
      setLoading(false)
    }
    load()
  }, [decodedNickname])

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

  const gameStats: GameStat[] = games.map(game => {
    const rs = allResults.filter(r => r.game_id === game.id)
    const completed = rs.filter(r => r.completed)
    const attempts = completed.filter(r => r.attempts !== null).map(r => r.attempts!)
    const completedDates = new Set(completed.map(r => r.date))
    return {
      game,
      totalPlayed: rs.length,
      totalCompleted: completed.length,
      totalScore: rs.reduce((sum, r) => sum + (r.score ?? 0), 0),
      avgAttempts: attempts.length
        ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length * 10) / 10
        : null,
      bestAttempts: attempts.length ? Math.min(...attempts) : null,
      currentStreak: calcStreak(recentDates, completedDates),
    }
  })

  const today = getKSTDate()
  const todayResults = byDate.get(today) ?? []
  const todayCompleted = todayResults.filter(r => r.completed).length
  const isMe = me?.id === profileUser?.id

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <div className="h-32 rounded-2xl bg-gray-100 animate-pulse mb-5" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  )

  if (notFound) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <p className="text-4xl mb-3">🙈</p>
      <p className="text-lg font-black text-gray-900">유저를 찾을 수 없어요</p>
      <p className="text-sm text-gray-400 mt-1">@{decodedNickname}</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* 프로필 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {isMe ? '내 프로필' : '유저 프로필'}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">{profileUser?.nickname}</h1>
              {isMe && (
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">나</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {profileUser && new Date(profileUser.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })} 가입
            </p>
          </div>

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
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {gameStats.map(stat => (
            <GameStatRow key={stat.game.id} stat={stat} />
          ))}
        </div>
      </section>

      {/* 날짜별 기록 */}
      <section>
        <h2 className="text-lg font-black text-gray-900 mb-3">최근 기록</h2>
        {dailyRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm font-semibold">아직 기록이 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dailyRecords.map(record => (
              <DailyRecordRow
                key={record.date}
                record={record}
                games={games}
                isToday={record.date === today}
              />
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

function GameStatRow({ stat }: { stat: GameStat }) {
  const [expanded, setExpanded] = useState(false)
  const completionRate = stat.totalPlayed
    ? Math.round(stat.totalCompleted / stat.totalPlayed * 100)
    : 0

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors active:bg-gray-100"
      >
        <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: stat.game.color }} />
        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">{stat.game.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-base font-black tabular-nums" style={{ color: stat.game.color }}>
              {stat.totalScore}
              <span className="text-xs font-semibold text-gray-400 ml-0.5">점</span>
            </span>
            <ChevronDown
              size={15}
              className={cn('text-gray-300 transition-transform shrink-0', expanded && 'rotate-180')}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 px-5 py-4 bg-gray-50/60 border-t border-gray-100">
          <StatItem label="완료" value={`${stat.totalCompleted}회`} />
          <StatItem label="완료율" value={stat.totalPlayed ? `${completionRate}%` : '-'} />
          <StatItem
            label={stat.game.slug === 'kkomanttle' ? '평균 추측' : '평균 시도'}
            value={stat.avgAttempts !== null ? `${stat.avgAttempts}회` : '-'}
          />
          <StatItem
            label="연속"
            value={stat.currentStreak > 0 ? `${stat.currentStreak}일` : '-'}
          />
        </div>
      )}
    </div>
  )
}

function DailyRecordRow({ record, games, isToday }: { record: DailyRecord; games: Game[]; isToday: boolean }) {
  const [open, setOpen] = useState(isToday)

  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden',
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
          <div className="flex items-center gap-1">
            {games.map(game => {
              const r = record.results.find(r => r.game_id === game.id)
              return (
                <div
                  key={game.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
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
              <span className="font-semibold text-gray-700">{r.game?.name}</span>
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
