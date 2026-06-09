'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Game, GameResult } from '@/types'

export interface GameStat {
  game: Game
  totalPlayed: number
  totalCompleted: number
  totalScore: number
  avgAttempts: number | null
  bestAttempts: number | null
  currentStreak: number
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-black text-gray-900">{value}</p>
    </div>
  )
}

export function buildGameStat(
  game: Game,
  results: (GameResult & { game?: Game })[],
  recentDates: string[],
): GameStat {
  const rs = results.filter(r => r.game_id === game.id)
  const completed = rs.filter(r => r.completed)
  const attempts = completed.filter(r => r.attempts !== null).map(r => r.attempts!)
  const completedDates = new Set(completed.map(r => r.date))

  let streak = 0
  for (const d of recentDates) {
    if (completedDates.has(d)) streak++
    else break
  }

  return {
    game,
    totalPlayed: rs.length,
    totalCompleted: completed.length,
    totalScore: rs.reduce((sum, r) => sum + (r.score ?? 0), 0),
    avgAttempts: attempts.length
      ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length * 10) / 10
      : null,
    bestAttempts: attempts.length ? Math.min(...attempts) : null,
    currentStreak: streak,
  }
}

export default function GameStatCard({ stat }: { stat: GameStat }) {
  const [expanded, setExpanded] = useState(false)
  const completionRate = stat.totalPlayed
    ? Math.round(stat.totalCompleted / stat.totalPlayed * 100) : 0
  const detailLabel = stat.game.slug === 'kkomanttle' ? '평균 추측' : '평균 시도'
  const detailValue = stat.avgAttempts !== null ? `${stat.avgAttempts}회` : '-'
  const streakValue = stat.currentStreak > 0 ? `${stat.currentStreak}일` : '-'

  return (
    <>
      {/* 모바일: 가로 리스트 카드 */}
      <div className="sm:hidden rounded-2xl border border-gray-100 overflow-hidden bg-white">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: stat.game.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{stat.game.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {stat.totalCompleted}회 완료{stat.totalPlayed > 0 && ` · ${completionRate}%`}
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-gray-900 shrink-0">
            {stat.totalScore}<span className="text-xs font-semibold text-gray-400 ml-0.5">점</span>
          </p>
          <ChevronDown size={14} className={cn('text-gray-300 shrink-0 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <div className="grid grid-cols-2 gap-y-2.5 px-4 py-3 bg-gray-50 border-t border-gray-100">
            <StatItem label={detailLabel} value={detailValue} />
            <StatItem label="연속" value={streakValue} />
          </div>
        )}
      </div>

      {/* 데스크탑: 세로 카드 */}
      <div className="hidden sm:block rounded-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left bg-white px-3.5 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <p className="text-2xl font-black tabular-nums leading-none text-gray-900">
            {stat.totalScore}
            <span className="text-sm font-semibold text-gray-400 ml-0.5">점</span>
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            {stat.totalCompleted}회 완료
            {stat.totalPlayed > 0 && <span className="ml-1">· {completionRate}%</span>}
          </p>
        </button>
        {expanded && (
          <div className="grid grid-cols-2 gap-y-2.5 px-3.5 py-3 bg-gray-50 border-t border-gray-100">
            <StatItem label={detailLabel} value={detailValue} />
            <StatItem label="연속" value={streakValue} />
          </div>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-3.5 py-2.5"
          style={{ backgroundColor: stat.game.color }}
        >
          <p className="text-sm font-black text-white leading-tight truncate">{stat.game.name}</p>
          <ChevronDown size={13} className={cn('text-white/60 shrink-0 ml-1 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>
    </>
  )
}
