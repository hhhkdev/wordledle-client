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
  gameResults: { game_id: string; completed: boolean }[]
}

function kstToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function kstYesterday() {
  return new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export default function HomeClient({ initialGames }: { initialGames: Game[] }) {
  const { user, loading: authLoading } = useAuth()
  const games = initialGames
  const [currentResults, setCurrentResults] = useState<Record<string, GameResult>>({})
  const [todayRanking, setTodayRanking] = useState<RankingEntry[]>([])
  const [rankingVersion, setRankingVersion] = useState(0)

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

        const byGame = new Map<string, GameResult[]>()
        for (const r of data as GameResult[]) {
          if (!byGame.has(r.game_id)) byGame.set(r.game_id, [])
          byGame.get(r.game_id)!.push(r)
        }

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
            if (!userMap.has(u.id)) userMap.set(u.id, { user: u, completedCount: 0, totalScore: 0, gameResults: [] })
            const e = userMap.get(u.id)!
            e.totalScore += r.score ?? 0
            if (r.completed) e.completedCount++
            e.gameResults.push({ game_id: r.game_id, completed: r.completed })
          }
          return Array.from(userMap.values())
            .sort((a, b) => b.totalScore - a.totalScore || b.completedCount - a.completedCount)
            .slice(0, 5)
        }

        setTodayRanking(buildRanking(today))
      })
  }, [rankingVersion])

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        {sortedGames.map(game => (
          <GameCard
            key={game.id}
            game={game}
            result={currentResults[game.id] ?? null}
            onResultChange={r => {
              setCurrentResults(prev => ({ ...prev, [r.game_id]: r }))
              setRankingVersion(v => v + 1)
            }}
          />
        ))}
      </div>

      {/* 이번 회차 랭킹 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            {todayStr} 랭킹
          </h2>
          <Link href="/ranking" className="flex items-center gap-0.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>

        {(() => {
          const base = todayRanking
          if (base.length === 0) return (
            <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-300 text-sm">
              아직 결과가 없어요
            </div>
          )
          const byScore = [...base].sort((a, b) => b.totalScore - a.totalScore || b.completedCount - a.completedCount)
          const byCount = [...base].sort((a, b) => b.completedCount - a.completedCount || b.totalScore - a.totalScore)

          return (
            <div className="grid grid-cols-2 gap-3">
              <RankPanel
                title="완료 횟수"
                entries={byCount}
                currentUserId={user?.id}
                totalGames={totalGames}
                valueKey="completed"
              />
              <RankPanel
                title="점수"
                entries={byScore}
                currentUserId={user?.id}
                totalGames={totalGames}
                valueKey="score"
              />
            </div>
          )
        })()}
      </div>

      <Announcements />
    </div>
  )
}

interface RankPanelEntry {
  user: User
  completedCount: number
  totalScore: number
}

function RankPanel({ title, entries, currentUserId, totalGames, valueKey }: {
  title: string
  entries: RankPanelEntry[]
  currentUserId?: string
  totalGames: number
  valueKey: 'score' | 'completed'
}) {
  const rankColors = ['text-amber-500', 'text-gray-400', 'text-orange-400']

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-50">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.slice(0, 5).map((entry, idx) => {
          const rank = idx + 1
          const isMe = entry.user.id === currentUserId
          const value = valueKey === 'score' ? entry.totalScore : entry.completedCount
          const unit = valueKey === 'score' ? '점' : `/${totalGames}`
          const valueColor = valueKey === 'score'
            ? (isMe ? 'text-blue-600' : 'text-indigo-500')
            : (isMe ? 'text-blue-600' : 'text-teal-500')

          return (
            <Link
              key={entry.user.id}
              href={`/users/${encodeURIComponent(entry.user.nickname)}`}
              className={cn(
                'flex items-center gap-2 px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors',
                isMe && 'bg-blue-50 hover:bg-blue-50/80'
              )}
            >
              <span className={cn('w-5 text-center text-sm font-black shrink-0',
                isMe ? 'text-blue-400' : (rankColors[rank - 1] ?? 'text-gray-300'))}>
                {rank}
              </span>
              <span className={cn('flex-1 text-sm font-bold truncate min-w-0',
                isMe ? 'text-blue-800' : 'text-gray-900')}>
                {entry.user.nickname}
                {isMe && <span className="ml-1 text-xs text-blue-400 font-normal">나</span>}
              </span>
              <span className={cn('text-base font-black tabular-nums shrink-0', valueColor)}>
                {value}<span className="text-xs font-semibold text-gray-400 ml-0.5">{unit}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
