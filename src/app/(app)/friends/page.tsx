'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Friend, User } from '@/types'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function FriendsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [friends, setFriends] = useState<(Friend & { friend: User })[]>([])
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
      const { data } = await supabase
        .from('friends')
        .select('*, friend:users!friends_friend_id_fkey(id, nickname, created_at)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (data) setFriends(data as (Friend & { friend: User })[])
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

    const alreadyFriend = friends.some(f => f.friend_id === target.id)
    if (alreadyFriend) {
      setAddError('이미 친구입니다.')
      setAddLoading(false)
      return
    }

    const { error } = await supabase
      .from('friends')
      .insert({ user_id: user.id, friend_id: target.id })

    if (error) {
      setAddError('친구 추가에 실패했습니다.')
      setAddLoading(false)
      return
    }

    setFriends(prev => [
      {
        id: crypto.randomUUID(),
        user_id: user.id,
        friend_id: target.id,
        created_at: new Date().toISOString(),
        friend: target as User,
      },
      ...prev,
    ])
    setNickname('')
    setAddLoading(false)
  }

  async function handleRemove(friendId: string) {
    if (!user) return
    const supabase = createClient()
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId)
    setFriends(prev => prev.filter(f => f.friend_id !== friendId))
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">친구</h1>
        <p className="text-sm text-gray-500 mt-1">친구를 추가하면 친구 랭킹을 볼 수 있어요.</p>
      </div>

      {/* Add friend */}
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
          <Button type="submit" loading={addLoading} className="shrink-0 self-start">
            추가
          </Button>
        </form>
      </div>

      {/* Friends list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <Users size={15} />
          친구 목록
          <span className="ml-auto text-xs font-normal text-gray-400">{friends.length}명</span>
        </h2>

        {loadingFriends ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">아직 친구가 없어요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map(f => (
              <div
                key={f.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.friend.nickname}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(f.created_at).toLocaleDateString('ko-KR')} 추가
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(f.friend_id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="친구 삭제"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
