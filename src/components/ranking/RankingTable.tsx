'use client'

import { useState } from 'react'
import { Game, GameResult, User } from '@/types'
import { cn } from '@/lib/utils'
import { UserPlus, UserMinus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
  primaryStat: number | null
}

interface RankingTableProps {
  entries: RankingEntry[]
  games: Game[]
  currentUserId?: string
  isKkomanttle?: boolean
  showDots?: boolean
  friendIds?: Set<string>
  onFriendChange?: (userId: string, added: boolean) => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

const TOP_RANK_STYLES = [
  { badge: 'bg-amber-400 text-white', row: 'bg-amber-50 border-amber-200' },
  { badge: 'bg-gray-300 text-white', row: 'bg-gray-50 border-gray-200' },
  { badge: 'bg-orange-300 text-white', row: 'bg-orange-50 border-orange-200' },
]

export default function RankingTable({
  entries, games, currentUserId, isKkomanttle, showDots,
  friendIds = new Set(), onFriendChange,
}: RankingTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const canAddFriends = !!currentUserId

  async function handleAddFriend(userId: string) {
    if (!currentUserId) return
    setActionLoading(true)
    setActionError('')
    const { error } = await createClient()
      .from('friends')
      .insert({ user_id: currentUserId, friend_id: userId })
    setActionLoading(false)
    if (error) { setActionError('추가에 실패했습니다.'); return }
    onFriendChange?.(userId, true)
    setSelectedEntry(null)
  }

  async function handleRemoveFriend(userId: string) {
    if (!currentUserId) return
    setActionLoading(true)
    setActionError('')
    const { error } = await createClient()
      .from('friends')
      .delete()
      .eq('user_id', currentUserId)
      .eq('friend_id', userId)
    setActionLoading(false)
    if (error) { setActionError('삭제에 실패했습니다.'); return }
    onFriendChange?.(userId, false)
    setSelectedEntry(null)
  }

  function openFriendSheet(entry: RankingEntry) {
    if (!canAddFriends) return
    if (entry.user.id === currentUserId) return
    setActionError('')
    setSelectedEntry(entry)
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">🏆</p>
        <p className="text-sm font-semibold text-gray-500">아직 결과가 없어요</p>
        <p className="text-xs text-gray-400 mt-1">게임을 완료하고 결과를 입력해보세요</p>
      </div>
    )
  }

  const alreadyFriend = selectedEntry ? friendIds.has(selectedEntry.user.id) : false

  return (
    <>
      <div className="flex flex-col gap-2">
        {entries.map((entry, idx) => {
          const isMe = entry.user.id === currentUserId
          const rank = idx + 1
          const topStyle = rank <= 3 && !isMe ? TOP_RANK_STYLES[rank - 1] : null
          const result = entry.results[0]
          const meta = result?.metadata as { time_seconds?: number } | null
          const isFriend = friendIds.has(entry.user.id)

          return (
            <div
              key={entry.user.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all',
                isMe
                  ? 'bg-blue-50 border-blue-200'
                  : topStyle
                  ? topStyle.row
                  : 'bg-white border-gray-100'
              )}
            >
              {/* Rank badge */}
              <div className={cn(
                'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm font-black',
                isMe
                  ? 'bg-blue-100 text-blue-600'
                  : topStyle
                  ? topStyle.badge
                  : 'bg-gray-100 text-gray-400'
              )}>
                {rank}
              </div>

              {/* Nickname + game dots */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openFriendSheet(entry)}
                    disabled={!canAddFriends || isMe}
                    className={cn(
                      'font-bold text-base truncate text-left transition-colors',
                      isMe
                        ? 'text-blue-800 cursor-default'
                        : canAddFriends
                        ? 'text-gray-900 hover:text-blue-600 active:opacity-70 cursor-pointer'
                        : 'text-gray-900 cursor-default'
                    )}
                  >
                    {entry.user.nickname}
                  </button>
                  {isMe && (
                    <span className="shrink-0 text-xs font-semibold text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded-md">나</span>
                  )}
                  {!isMe && isFriend && (
                    <span className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">친구</span>
                  )}
                </div>

                {showDots && games.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {games.map(g => {
                      const r = entry.results.find(r => r.game_id === g.id)
                      return (
                        <div
                          key={g.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: r?.completed ? g.color : '#e5e7eb' }}
                          title={g.name}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 shrink-0">
                {isKkomanttle ? (
                  <>
                    <div className="text-right">
                      <p className={cn('text-[11px]', isMe ? 'text-blue-400' : 'text-gray-400')}>추측</p>
                      <p className={cn('text-sm font-black', isMe ? 'text-blue-800' : 'text-gray-900')}>
                        {result?.attempts ?? '-'}회
                      </p>
                    </div>
                    {meta?.time_seconds != null && (
                      <div className={cn('px-2.5 py-1.5 rounded-xl text-right', isMe ? 'bg-blue-100' : 'bg-gray-100')}>
                        <p className={cn('text-[11px]', isMe ? 'text-blue-400' : 'text-gray-400')}>시간</p>
                        <p className={cn('text-sm font-black tabular-nums', isMe ? 'text-blue-800' : 'text-gray-900')}>
                          {formatTime(meta.time_seconds)}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-right">
                    <p className={cn('text-xl font-black tabular-nums leading-tight', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {entry.totalScore}
                      <span className={cn('text-xs font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    </p>
                    <p className={cn('text-[11px] mt-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>
                      {entry.completedCount}회 완료
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 친구 추가/삭제 시트 */}
      {selectedEntry && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedEntry(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl max-w-lg mx-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pt-3 pb-8">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">
                    {alreadyFriend ? '친구' : '랭킹'}
                  </p>
                  <p className="text-lg font-black text-gray-900">{selectedEntry.user.nickname}</p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {actionError && (
                <p className="text-xs text-red-500 mb-3">{actionError}</p>
              )}

              {alreadyFriend ? (
                <button
                  onClick={() => handleRemoveFriend(selectedEntry.user.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-500 font-bold text-sm active:opacity-70 transition-opacity disabled:opacity-50"
                >
                  <UserMinus size={16} />
                  {actionLoading ? '처리 중...' : '친구 삭제'}
                </button>
              ) : (
                <button
                  onClick={() => handleAddFriend(selectedEntry.user.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-sm active:opacity-70 transition-opacity disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  {actionLoading ? '처리 중...' : '친구 추가'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
