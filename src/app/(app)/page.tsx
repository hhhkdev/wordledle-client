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
        {/* 헤더 + 탭 한 줄 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              이번 회차 랭킹
            </h2>
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
              {(['today', 'yesterday'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRankingTab(t)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold transition-colors',
                    rankingTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                  )}
                >
                  {t === 'today' ? '오늘' : '어제'}
                </button>
              ))}
            </div>
          </div>
          <Link href="/ranking" className="flex items-center gap-0.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>

        {(rankingTab === 'today' ? todayRanking : yesterdayRanking).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-300 text-sm">
            아직 결과가 없어요
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {(rankingTab === 'today' ? todayRanking : yesterdayRanking).map((entry, idx) => {
              const rank = idx + 1
              const isMe = entry.user.id === user?.id
              const badgeStyle = isMe
                ? 'bg-blue-100 text-blue-600'
                : rank === 1 ? 'bg-amber-400 text-white'
                : rank === 2 ? 'bg-gray-300 text-white'
                : rank === 3 ? 'bg-orange-300 text-white'
                : 'bg-gray-100 text-gray-400'
              return (
                <Link
                  key={entry.user.id}
                  href={`/users/${encodeURIComponent(entry.user.nickname)}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors',
                    isMe && 'bg-blue-50 hover:bg-blue-50/80'
                  )}
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black', badgeStyle)}>
                    {rank}
                  </div>
                  <span className={cn('flex-1 text-sm font-bold truncate', isMe ? 'text-blue-800' : 'text-gray-900')}>
                    {entry.user.nickname}
                    {isMe && <span className="ml-1.5 text-xs text-blue-400 font-normal">나</span>}
                  </span>
                  <div className="text-right shrink-0">
                    <span className={cn('text-base font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {entry.totalScore}
                    </span>
                    <span className={cn('text-xs font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    <p className={cn('text-xs', isMe ? 'text-blue-400' : 'text-gray-400')}>
                      {entry.completedCount}/{totalGames} 완료
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Announcements />
    </div>
  )
}
