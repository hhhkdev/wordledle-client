'use client'

import { GameResult, User } from '@/types'
import { cn } from '@/lib/utils'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
  primaryStat: number | null
}

interface RankingTableProps {
  entries: RankingEntry[]
  currentUserId?: string
  isKkomanttle?: boolean
}

const RANK_STYLES = [
  'bg-amber-100 text-amber-600',   // 1st
  'bg-gray-100 text-gray-500',     // 2nd
  'bg-orange-100 text-orange-500', // 3rd
]

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

export default function RankingTable({ entries, currentUserId, isKkomanttle }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm font-semibold text-gray-500">아직 결과가 없어요</p>
        <p className="text-xs text-gray-400 mt-1">게임을 완료하고 결과를 입력해보세요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, idx) => {
        const isMe = entry.user.id === currentUserId
        const rank = idx + 1
        const result = entry.results[0]
        const meta = result?.metadata as { time_seconds?: number } | null
        const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : 'bg-gray-50 text-gray-400'

        return (
          <div
            key={entry.user.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all',
              isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
            )}
          >
            {/* Rank badge */}
            <div className={cn(
              'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm font-black',
              isMe ? 'bg-blue-100 text-blue-600' : rankStyle
            )}>
              {rank}
            </div>

            {/* Nickname */}
            <div className="flex-1 min-w-0">
              <span className={cn(
                'font-bold truncate block text-base',
                isMe ? 'text-blue-800' : 'text-gray-900'
              )}>
                {entry.user.nickname}
                {isMe && <span className="ml-1.5 text-xs font-normal text-blue-400">나</span>}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 shrink-0">
              {isKkomanttle ? (
                <>
                  <div className="text-right">
                    <p className={cn('text-xs', isMe ? 'text-blue-400' : 'text-gray-400')}>추측</p>
                    <p className={cn('text-sm font-black', isMe ? 'text-blue-800' : 'text-gray-900')}>
                      {result?.attempts ?? '-'}회
                    </p>
                  </div>
                  {meta?.time_seconds != null && (
                    <div className={cn('px-2.5 py-1.5 rounded-xl text-right', isMe ? 'bg-blue-100' : 'bg-gray-50')}>
                      <p className={cn('text-xs', isMe ? 'text-blue-400' : 'text-gray-400')}>시간</p>
                      <p className={cn('text-sm font-black tabular-nums', isMe ? 'text-blue-800' : 'text-gray-900')}>
                        {formatTime(meta.time_seconds)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-right">
                  <p className={cn('text-xl font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                    {entry.totalScore}
                    <span className={cn('text-xs font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                  </p>
                  <p className={cn('text-xs mt-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>
                    {entry.completedCount}회 완료
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
