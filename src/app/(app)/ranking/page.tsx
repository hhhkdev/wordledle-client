'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import RankingTable from '@/components/ranking/RankingTable'
import { Users, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'global' | 'friends'
type SortKey = 'completed' | 'score'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
  primaryStat: number | null
}

function buildEntries(resultsData: (GameResult & { user: User })[]) {
  const entriesMap = new Map<string, RankingEntry>()
  for (const r of resultsData) {
    const u = r.user
    if (!u) continue
    if (!entriesMap.has(u.id)) {
      entriesMap.set(u.id, { user: u, results: [], totalScore: 0, completedCount: 0, primaryStat: null })
    }
    const entry = entriesMap.get(u.id)!
    entry.results.push(r)
    entry.totalScore += r.score ?? 0
    if (r.completed) entry.completedCount++
  }
  return entriesMap
}

function sortEntries(entries: RankingEntry[], selectedGameSlug: string | null, sortKey: SortKey) {
  // 꼬맨틀 단독 선택: 총 시도 횟수 오름차순 (적을수록 잘한 것)
  if (selectedGameSlug === 'kkomanttle') {
    return [...entries].sort((a, b) => {
      const aAttempts = a.results.reduce((sum, r) => sum + (r.attempts ?? 0), 0)
      const bAttempts = b.results.reduce((sum, r) => sum + (r.attempts ?? 0), 0)
      return aAttempts - bAttempts
    })
  }
  if (sortKey === 'score') {
    return [...entries].sort((a, b) => b.totalScore - a.totalScore)
  }
  // 완료순 (기본): 완료 횟수 내림차순 → 점수 내림차순
  return [...entries].sort((a, b) =>
    b.completedCount !== a.completedCount
      ? b.completedCount - a.completedCount
      : b.totalScore - a.totalScore
  )
}

export default function RankingPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('global')
  const [sortKey, setSortKey] = useState<SortKey>('completed')
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [globalEntries, setGlobalEntries] = useState<RankingEntry[]>([])
  const [friendEntries, setFriendEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: gamesData } = await supabase.from('games').select('*').order('name')
      if (gamesData) setGames(gamesData as Game[])

      const { data: resultsData } = await supabase
        .from('results')
        .select('*, user:users(id, nickname, created_at)')

      if (resultsData) {
        const entriesMap = buildEntries(resultsData as (GameResult & { user: User })[])
        setGlobalEntries(Array.from(entriesMap.values()))
      }
      setLoading(false)
    }
    load()
  }, [])

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
        .in('user_id', allIds)

      if (resultsData) {
        const entriesMap = buildEntries(resultsData as (GameResult & { user: User })[])
        setFriendEntries(Array.from(entriesMap.values()))
      }
    }
    loadFriends()
  }, [user])

  const selectedGameObj = games.find(g => g.id === selectedGame)
  const selectedGameSlug = selectedGameObj?.slug ?? null
  const isKkomanttle = selectedGameSlug === 'kkomanttle'

  function filterByGame(entries: RankingEntry[]): RankingEntry[] {
    if (selectedGame === 'all') return sortEntries(entries, null, sortKey)

    const filtered = entries
      .map(e => {
        const gameResults = e.results.filter(r => r.game_id === selectedGame)
        const totalScore = gameResults.reduce((sum, r) => sum + (r.score ?? 0), 0)
        const completedCount = gameResults.filter(r => r.completed).length
        return { ...e, results: gameResults, totalScore, completedCount }
      })
      .filter(e => e.results.length > 0)

    return sortEntries(filtered, selectedGameSlug, sortKey)
  }

  const shownEntries = tab === 'global' ? filterByGame(globalEntries) : filterByGame(friendEntries)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">랭킹</h1>
        <p className="text-sm text-gray-500 mt-1">누적 랭킹</p>
      </div>

      {/* Game filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4">
        <button
          onClick={() => setSelectedGame('all')}
          className={cn(
            'shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors active:opacity-70',
            selectedGame === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600'
          )}
        >
          전체
        </button>
        {games.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGame(g.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors active:opacity-70',
              selectedGame === g.id
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            )}
            style={selectedGame === g.id ? { backgroundColor: g.color } : undefined}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-3">
        <button
          onClick={() => setTab('global')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70',
            tab === 'global' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          <Globe size={15} />
          전체 랭킹
        </button>
        <button
          onClick={() => setTab('friends')}
          disabled={!user}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed',
            tab === 'friends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          <Users size={15} />
          친구 랭킹
        </button>
      </div>

      {/* 정렬 토글 / 꼬맨틀 안내 */}
      <div className="mb-5">
        {isKkomanttle ? (
          <p className="text-xs text-gray-400 py-1">총 추측 횟수 오름차순</p>
        ) : (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setSortKey('completed')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70',
                sortKey === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              완료순
            </button>
            <button
              onClick={() => setSortKey('score')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70',
                sortKey === 'score' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              점수순
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <RankingTable
          entries={shownEntries}
          currentUserId={user?.id}
          isKkomanttle={isKkomanttle}
        />
      )}
    </div>
  )
}
