'use client'

import { GameResult, User } from '@/types'
import { cn } from '@/lib/utils'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
}

interface RankingTableProps {
  entries: RankingEntry[]
  currentUserId?: string
}

const RANK_STYLES = [
  { bg: 'bg-yellow-400', text: 'text-yellow-900', label: '🥇' },
  { bg: 'bg-gray-300', text: 'text-gray-700', label: '🥈' },
  { bg: 'bg-amber-500', text: 'text-amber-900', label: '🥉' },
]

export default function RankingTable({ entries, currentUserId }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm font-semibold text-gray-500">아직 오늘의 결과가 없어요</p>
        <p className="text-xs text-gray-400 mt-1">게임을 완료하고 결과를 입력해보세요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, idx) => {
        const isMe = entry.user.id === currentUserId
        const rank = idx + 1
        const rankStyle = RANK_STYLES[idx]

        return (
          <div
            key={entry.user.id}
            className={cn(
              'flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all',
              isMe
                ? 'bg-gray-900 border-gray-900'
                : 'bg-white border-gray-200 hover:border-gray-300'
            )}
          >
            {/* Rank badge */}
            <div className="w-8 shrink-0 flex items-center justify-center">
              {rankStyle ? (
                <span className="text-xl leading-none">{rankStyle.label}</span>
              ) : (
                <span className={cn(
                  'text-sm font-black w-7 h-7 flex items-center justify-center rounded-full',
                  isMe ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {rank}
                </span>
              )}
            </div>

            {/* Nickname */}
            <div className="flex-1 min-w-0">
              <span className={cn(
                'text-sm font-bold truncate block',
                isMe ? 'text-white' : 'text-gray-900'
              )}>
                {entry.user.nickname}
                {isMe && (
                  <span className={cn('ml-1.5 text-xs font-semibold', isMe ? 'text-white/50' : 'text-gray-400')}>
                    나
                  </span>
                )}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className={cn('text-xs font-medium', isMe ? 'text-white/50' : 'text-gray-400')}>완료</p>
                <p className={cn('text-sm font-black', isMe ? 'text-white' : 'text-gray-900')}>
                  {entry.completedCount}
                </p>
              </div>
              <div className={cn(
                'px-3 py-1.5 rounded-xl text-right',
                isMe ? 'bg-white/15' : 'bg-gray-50'
              )}>
                <p className={cn('text-xs font-medium', isMe ? 'text-white/50' : 'text-gray-400')}>점수</p>
                <p className={cn('text-sm font-black', isMe ? 'text-white' : 'text-gray-900')}>
                  {entry.totalScore}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
