'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import RankingTable from '@/components/ranking/RankingTable'
import { Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'global' | 'friends'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
}

export default function RankingPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('global')
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [globalEntries, setGlobalEntries] = useState<RankingEntry[]>([])
  const [friendEntries, setFriendEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Load games
      const { data: gamesData } = await supabase.from('games').select('*').order('name')
      if (gamesData) setGames(gamesData as Game[])

      // Load today's global results with user info
      const { data: resultsData } = await supabase
        .from('results')
        .select('*, user:users(id, nickname, created_at)')
        .eq('date', today)

      if (resultsData) {
        const entriesMap = new Map<string, RankingEntry>()
        for (const r of resultsData) {
          const u = r.user as User
          if (!u) continue
          if (!entriesMap.has(u.id)) {
            entriesMap.set(u.id, { user: u, results: [], totalScore: 0, completedCount: 0 })
          }
          const entry = entriesMap.get(u.id)!
          entry.results.push(r as GameResult)
          entry.totalScore += r.score ?? 0
          if (r.completed) entry.completedCount++
        }
        const sorted = Array.from(entriesMap.values()).sort((a, b) =>
          b.completedCount !== a.completedCount
            ? b.completedCount - a.completedCount
            : b.totalScore - a.totalScore
        )
        setGlobalEntries(sorted)
      }

      setLoading(false)
    }
    load()
  }, [today])

  useEffect(() => {
    if (!user) return

    async function loadFriends() {
      const supabase = createClient()

      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user!.id)

      const friendIds = (friendsData ?? []).map(f => f.friend_id)
      const allIds = [user!.id, ...friendIds]

      const { data: resultsData } = await supabase
        .from('results')
        .select('*, user:users(id, nickname, created_at)')
        .eq('date', today)
        .in('user_id', allIds)

      if (resultsData) {
        const entriesMap = new Map<string, RankingEntry>()
        for (const r of resultsData) {
          const u = r.user as User
          if (!u) continue
          if (!entriesMap.has(u.id)) {
            entriesMap.set(u.id, { user: u, results: [], totalScore: 0, completedCount: 0 })
          }
          const entry = entriesMap.get(u.id)!
          entry.results.push(r as GameResult)
          entry.totalScore += r.score ?? 0
          if (r.completed) entry.completedCount++
        }
        const sorted = Array.from(entriesMap.values()).sort((a, b) =>
          b.completedCount !== a.completedCount
            ? b.completedCount - a.completedCount
            : b.totalScore - a.totalScore
        )
        setFriendEntries(sorted)
      }
    }
    loadFriends()
  }, [user, today])

  function filterByGame(entries: RankingEntry[]): RankingEntry[] {
    if (selectedGame === 'all') return entries
    return entries
      .map(e => {
        const filtered = e.results.filter(r => r.game_id === selectedGame)
        const totalScore = filtered.reduce((sum, r) => sum + (r.score ?? 0), 0)
        const completedCount = filtered.filter(r => r.completed).length
        return { ...e, results: filtered, totalScore, completedCount }
      })
      .filter(e => e.results.length > 0)
      .sort((a, b) =>
        b.completedCount !== a.completedCount
          ? b.completedCount - a.completedCount
          : b.totalScore - a.totalScore
      )
  }

  const displayedDate = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  const shownEntries = tab === 'global' ? filterByGame(globalEntries) : filterByGame(friendEntries)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">랭킹</h1>
        <p className="text-sm text-gray-500 mt-1">{displayedDate} 기준</p>
      </div>

      {/* Game filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => setSelectedGame('all')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedGame === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          전체
        </button>
        {games.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedGame === g.id
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            )}
            style={selectedGame === g.id ? { backgroundColor: g.color } : undefined}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-fit">
        <button
          onClick={() => setTab('global')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            tab === 'global' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Globe size={15} />
          전체 랭킹
        </button>
        <button
          onClick={() => setTab('friends')}
          disabled={!user}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            tab === 'friends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Users size={15} />
          친구 랭킹
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <RankingTable entries={shownEntries} currentUserId={user?.id} />
      )}
    </div>
  )
}
