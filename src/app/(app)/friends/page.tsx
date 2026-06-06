'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Friend, User } from '@/types'
import { UserPlus, UserMinus, Users, ChevronRight, ArrowUpDown, Check } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FriendStats {
  totalScore: number
  todayCompleted: number
  todayTotal: number
  lastSubmitted: string | null
}

type SortKey = 'score' | 'alpha' | 'recent' | 'added'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score',  label: '점수순' },
  { key: 'alpha',  label: '가나다순' },
  { key: 'recent', label: '최근 제출순' },
  { key: 'added',  label: '친구 추가순' },
]

function kstToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function sortFriends(
  friends: (Friend & { friend: User })[],
  stats: Record<string, FriendStats>,
  key: SortKey,
) {
  return [...friends].sort((a, b) => {
    switch (key) {
      case 'score':
        return (stats[b.friend_id]?.totalScore ?? -1) - (stats[a.friend_id]?.totalScore ?? -1)
      case 'alpha':
        return a.friend.nickname.localeCompare(b.friend.nickname, 'ko')
      case 'recent': {
        const la = stats[a.friend_id]?.lastSubmitted ?? ''
        const lb = stats[b.friend_id]?.lastSubmitted ?? ''
        return lb.localeCompare(la)
      }
      case 'added':
        return b.created_at.localeCompare(a.created_at)
    }
  })
}

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const label = SORT_OPTIONS.find(o => o.key === value)?.label ?? value

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors active:opacity-70',
          open ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-150',
        )}
      >
        <ArrowUpDown size={12} />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-32">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors',
                value === key
                  ? 'bg-gray-50 font-bold text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 font-semibold',
              )}
            >
              {label}
              {value === key && <Check size={12} className="text-blue-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FriendsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [friends, setFriends] = useState<(Friend & { friend: User })[]>([])
  const [friendStats, setFriendStats] = useState<Record<string, FriendStats>>({})
  const [totalGames, setTotalGames] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [nickname, setNickname] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    async function loadFriends() {
      const supabase = createClient()
      const [{ data: friendsData }, { count: gamesCount }] = await Promise.all([
        supabase
          .from('friends')
          .select('*, friend:users!friends_friend_id_fkey(id, nickname, created_at)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase.from('games').select('*', { count: 'exact', head: true }),
      ])

      if (friendsData) {
        setFriends(friendsData as (Friend & { friend: User })[])
        setTotalGames(gamesCount ?? 0)

        const friendIds = friendsData.map((f: Friend) => f.friend_id)
        if (friendIds.length > 0) {
          const today = kstToday()
          const { data: resultsData } = await supabase
            .from('results')
            .select('user_id, score, completed, date')
            .in('user_id', friendIds)
            .order('date', { ascending: false })

          const stats: Record<string, FriendStats> = {}
          for (const r of resultsData ?? []) {
            if (!stats[r.user_id]) stats[r.user_id] = { totalScore: 0, todayCompleted: 0, todayTotal: 0, lastSubmitted: null }
            const s = stats[r.user_id]
            s.totalScore += r.score ?? 0
            if (!s.lastSubmitted) s.lastSubmitted = r.date
            if (r.date === today) {
              s.todayTotal++
              if (r.completed) s.todayCompleted++
            }
          }
          setFriendStats(stats)
        }
      }
      setLoadingFriends(false)
    }
    loadFriends()
  }, [user])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!user || !nickname.trim()) return
    setAddLoading(true)
    setAddError('')

    const supabase = createClient()

    if (nickname.trim() === user.nickname) {
      setAddError('자기 자신을 친구 추가할 수 없습니다.')
      setAddLoading(false)
      return
    }

    const { data: target } = await supabase
      .from('users')
      .select('id, nickname, created_at')
      .eq('nickname', nickname.trim())
      .single()

    if (!target) {
      setAddError('해당 닉네임의 유저를 찾을 수 없습니다.')
      setAddLoading(false)
      return
    }

    if (friends.some(f => f.friend_id === target.id)) {
      setAddError('이미 친구입니다.')
      setAddLoading(false)
      return
    }

    const { error } = await supabase.from('friends').insert({ user_id: user.id, friend_id: target.id })
    if (error) {
      setAddError('친구 추가에 실패했습니다.')
      setAddLoading(false)
      return
    }

    setFriends(prev => [{
      id: crypto.randomUUID(),
      user_id: user.id,
      friend_id: target.id,
      created_at: new Date().toISOString(),
      friend: target as User,
    }, ...prev])

    // 새 친구 stats 로드
    const today = kstToday()
    const { data: resultsData } = await supabase
      .from('results')
      .select('user_id, score, completed, date')
      .eq('user_id', target.id)
      .order('date', { ascending: false })
    const stat: FriendStats = { totalScore: 0, todayCompleted: 0, todayTotal: 0, lastSubmitted: null }
    for (const r of resultsData ?? []) {
      stat.totalScore += r.score ?? 0
      if (!stat.lastSubmitted) stat.lastSubmitted = r.date
      if (r.date === today) {
        stat.todayTotal++
        if (r.completed) stat.todayCompleted++
      }
    }
    setFriendStats(prev => ({ ...prev, [target.id]: stat }))

    setNickname('')
    setAddLoading(false)
  }

  async function handleRemove(friendId: string) {
    if (!user) return
    await createClient().from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId)
    setFriends(prev => prev.filter(f => f.friend_id !== friendId))
  }

  if (authLoading || !user) return null

  const sortedFriends = sortFriends(friends, friendStats, sortKey)

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">친구</h1>
        <p className="text-sm text-gray-500 mt-1">친구를 추가하면 친구 랭킹을 볼 수 있어요.</p>
      </div>

      {/* 친구 추가 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <UserPlus size={15} />
          친구 추가
        </h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="친구의 닉네임을 입력하세요"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setAddError('') }}
              error={addError}
            />
          </div>
          <Button type="submit" loading={addLoading} className="shrink-0 self-start">추가</Button>
        </form>
      </div>

      {/* 친구 목록 */}
      <div className="rounded-2xl border border-gray-100">
        <div className="bg-white rounded-t-2xl px-5 py-3.5 border-b border-gray-50 flex items-center gap-1.5">
          <Users size={15} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-700">친구 목록</h2>
          <span className="text-xs font-normal text-gray-400 ml-0.5">{friends.length}명</span>
          <div className="ml-auto">
            <SortDropdown value={sortKey} onChange={setSortKey} />
          </div>
        </div>

        <div className="bg-white rounded-b-2xl overflow-hidden">
        {loadingFriends ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 px-5 py-4 flex flex-col gap-2">
                <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-36 rounded bg-gray-50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">아직 친구가 없어요.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedFriends.map(f => {
              const stats = friendStats[f.friend_id]
              const todayDone = stats?.todayCompleted ?? 0

              return (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                  <Link href={`/users/${encodeURIComponent(f.friend.nickname)}`} className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {f.friend.nickname}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {stats ? (
                        <>
                          <span className="text-xs text-gray-500 font-semibold tabular-nums">
                            {stats.totalScore.toLocaleString()}점
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className={cn(
                            'text-xs font-semibold tabular-nums',
                            stats.todayTotal > 0 && todayDone === totalGames ? 'text-green-500' :
                            stats.todayTotal > 0 ? 'text-blue-500' : 'text-gray-400',
                          )}>
                            오늘 {todayDone}/{totalGames}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">기록 없음</span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/users/${encodeURIComponent(f.friend.nickname)}`}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <ChevronRight size={15} />
                    </Link>
                    <button
                      onClick={() => handleRemove(f.friend_id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="친구 삭제"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
