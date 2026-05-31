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

const RANK_MEDAL = ['🥇', '🥈', '🥉']

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
        const result = entry.results[0]
        const meta = result?.metadata as { time_seconds?: number; streak?: number } | null

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
            {/* Rank */}
            <div className="w-8 shrink-0 flex items-center justify-center">
              {rank <= 3 ? (
                <span className="text-xl leading-none">{RANK_MEDAL[rank - 1]}</span>
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
                  <span className={cn('ml-1.5 text-xs font-normal', isMe ? 'text-white/40' : 'text-gray-400')}>
                    나
                  </span>
                )}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 shrink-0">
              {isKkomanttle ? (
                // 꼬맨틀 전용: 시도 횟수 + 소요 시간
                <>
                  <div className="text-right">
                    <p className={cn('text-xs font-medium', isMe ? 'text-white/50' : 'text-gray-400')}>추측</p>
                    <p className={cn('text-sm font-black', isMe ? 'text-white' : 'text-gray-900')}>
                      {result?.attempts ?? '-'}회
                    </p>
                  </div>
                  {meta?.time_seconds != null && (
                    <div className={cn(
                      'px-3 py-1.5 rounded-xl text-right',
                      isMe ? 'bg-white/15' : 'bg-gray-50'
                    )}>
                      <p className={cn('text-xs font-medium', isMe ? 'text-white/50' : 'text-gray-400')}>시간</p>
                      <p className={cn('text-sm font-black tabular-nums', isMe ? 'text-white' : 'text-gray-900')}>
                        {formatTime(meta.time_seconds)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // 일반 게임: 완료 수 + 점수
                <>
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
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
