'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import GameCard from '@/components/game/GameCard'
import Announcements from '@/components/Announcements'
import Link from 'next/link'
import { Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getGameCurrentPeriodStart } from '@/lib/games'

interface RankingEntry {
  user: User
  completedCount: number
  totalScore: number
}

const RANK_BADGE_STYLES = [
  'bg-amber-100 text-amber-600',
  'bg-gray-100 text-gray-500',
  'bg-orange-100 text-orange-500',
]

function kstToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function kstYesterday() {
  return new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [currentResults, setCurrentResults] = useState<Record<string, GameResult>>({})
  const [todayRanking, setTodayRanking] = useState<RankingEntry[]>([])
  const [yesterdayRanking, setYesterdayRanking] = useState<RankingEntry[]>([])
  const [rankingTab, setRankingTab] = useState<'today' | 'yesterday'>('today')
  const [loadingGames, setLoadingGames] = useState(true)

  useEffect(() => {
    createClient().from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data as Game[])
      setLoadingGames(false)
    })
  }, [])

  // 현재 회차 결과 (lamp 지시등용) — 게임별 초기화 시각 기준
  useEffect(() => {
    if (!user || games.length === 0) return
    const yesterday = kstYesterday()
    createClient()
      .from('results')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', yesterday)
      .then(({ data }) => {
        if (!data) return

        // game_id 별로 묶기
        const byGame = new Map<string, GameResult[]>()
        for (const r of data as GameResult[]) {
          if (!byGame.has(r.game_id)) byGame.set(r.game_id, [])
          byGame.get(r.game_id)!.push(r)
        }

        // 각 게임의 현재 회차 시작 이후 결과만
        const valid: Record<string, GameResult> = {}
        for (const game of games) {
          const periodStart = getGameCurrentPeriodStart(game.slug)
          const latest = (byGame.get(game.id) ?? [])
            .filter(r => r.date >= periodStart)
            .sort((a, b) => b.date.localeCompare(a.date))[0]
          if (latest) valid[game.id] = latest
        }
        setCurrentResults(valid)
      })
  }, [user, games])

  // 오늘·어제 랭킹
  useEffect(() => {
    const yesterday = kstYesterday()
    const today = kstToday()
    createClient()
      .from('results')
      .select('user_id, game_id, score, completed, date, user:users(id, nickname, created_at)')
      .gte('date', yesterday)
      .lte('date', today)
      .then(({ data }) => {
        if (!data) return

        function buildRanking(dateStr: string) {
          const rows = data!.filter(r => r.date === dateStr)
          const userMap = new Map<string, RankingEntry>()
          for (const r of rows) {
            const u = (Array.isArray(r.user) ? r.user[0] : r.user) as User
            if (!u) continue
            if (!userMap.has(u.id)) userMap.set(u.id, { user: u, completedCount: 0, totalScore: 0 })
            const e = userMap.get(u.id)!
            e.totalScore += r.score ?? 0
            if (r.completed) e.completedCount++
          }
          return Array.from(userMap.values())
            .sort((a, b) =>
              b.completedCount !== a.completedCount
                ? b.completedCount - a.completedCount
                : b.totalScore - a.totalScore
            )
            .slice(0, 5)
        }

        setTodayRanking(buildRanking(today))
        setYesterdayRanking(buildRanking(yesterday))
      })
  }, [])

  const completedCount = Object.values(currentResults).filter(r => r.completed).length
  const totalGames = games.length

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul',
  })

  const sortedGames = [...games].sort((a, b) => {
    if (!user) return 0
    const aHas = !!currentResults[a.id]
    const bHas = !!currentResults[b.id]
    if (aHas === bHas) return 0
    return aHas ? 1 : -1
  })

  return (
    <div>
      {/* 날짜 + 완료 현황 */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-gray-400">{todayStr}</p>
        {user && totalGames > 0 && (
          <span className="text-sm font-bold text-gray-500">
            <span className="text-gray-900">{completedCount}</span>/{totalGames} 완료
          </span>
        )}
      </div>

{user && totalGames > 0 && completedCount === totalGames && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-3 mb-5">
          <span className="text-lg">🎉</span>
          <p className="text-sm font-bold text-green-800">오늘 모든 게임을 완료했어요!</p>
        </div>
      )}

      {/* 게임 목록 */}
      {loadingGames ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              result={currentResults[game.id] ?? null}
              onResultChange={r => setCurrentResults(prev => ({ ...prev, [r.game_id]: r }))}
            />
          ))}
        </div>
      )}

      {/* 오늘·어제 랭킹 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            이번 회차 랭킹
          </h2>
          <Link href="/ranking" className="flex items-center gap-0.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-3 w-fit">
          {(['today', 'yesterday'] as const).map(t => (
            <button
              key={t}
              onClick={() => setRankingTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                rankingTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              {t === 'today' ? '오늘' : '어제'}
            </button>
          ))}
        </div>

        {(rankingTab === 'today' ? todayRanking : yesterdayRanking).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-10 text-center text-gray-300 text-sm">
            아직 결과가 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 1위 강조 */}
            {(rankingTab === 'today' ? todayRanking : yesterdayRanking)[0] && (() => {
              const e = (rankingTab === 'today' ? todayRanking : yesterdayRanking)[0]
              const isMe = e.user.id === user?.id
              return (
                <div className={cn(
                  'flex items-center gap-3 px-4 py-4 rounded-2xl border-2',
                  isMe ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                )}>
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg font-black',
                    isMe ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  )}>1</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-lg font-black truncate', isMe ? 'text-blue-800' : 'text-gray-900')}>
                      {e.user.nickname}
                      {isMe && <span className="ml-1.5 text-sm text-blue-400 font-normal">나</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-2xl font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {e.totalScore}<span className={cn('text-sm font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    </p>
                    <p className={cn('text-xs mt-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>{e.completedCount}/{totalGames}</p>
                  </div>
                </div>
              )
            })()}

            {/* 2~5위 */}
            {(rankingTab === 'today' ? todayRanking : yesterdayRanking).slice(1).map((entry, idx) => {
              const rank = idx + 2
              const isMe = entry.user.id === user?.id
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-2xl border',
                    isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm font-black',
                    isMe ? 'bg-blue-100 text-blue-600' : (RANK_BADGE_STYLES[rank - 1] ?? 'bg-gray-50 text-gray-400')
                  )}>{rank}</div>
                  <span className={cn('flex-1 text-sm font-bold truncate', isMe ? 'text-blue-800' : 'text-gray-800')}>
                    {entry.user.nickname}
                    {isMe && <span className="ml-1 text-xs text-blue-400 font-normal">나</span>}
                  </span>
                  <div className="text-right shrink-0">
                    <p className={cn('text-base font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {entry.totalScore}<span className={cn('text-xs font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    </p>
                    <p className={cn('text-xs', isMe ? 'text-blue-400' : 'text-gray-400')}>
                      {entry.completedCount}/{totalGames}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Announcements />
    </div>
  )
}
