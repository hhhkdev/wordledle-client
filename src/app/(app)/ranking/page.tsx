'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import RankingTable from '@/components/ranking/RankingTable'
import RankingFilterSheet, { FilterState } from '@/components/ranking/RankingFilterSheet'
import SortDropdown, { SortKey } from '@/components/ranking/SortDropdown'
import { Users, Globe, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'global' | 'friends'

interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
  primaryStat: number | null
}

function kstToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

function kstTodayMonth(): string {
  return kstToday().slice(0, 7)
}

function getDateRange(filter: FilterState): { gte?: string; lte?: string } | null {
  const today = kstToday()
  switch (filter.period) {
    case 'all': return null
    case 'today': return { gte: today, lte: today }
    case 'month': {
      const [y, m] = filter.selectedMonth.split('-').map(Number)
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const lastDay = new Date(y, m, 0).getDate()
      const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return { gte: start, lte: end }
    }
    case 'range': return { gte: filter.rangeStart, lte: filter.rangeEnd }
  }
}

function getPeriodLabel(filter: FilterState): string {
  const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })
  switch (filter.period) {
    case 'all': return '전체 기간 누적'
    case 'today': return `오늘 (${todayLabel}) 기준`
    case 'month': {
      const [y, m] = filter.selectedMonth.split('-')
      return `${y}년 ${parseInt(m)}월`
    }
    case 'range': {
      const fmt = (d: string) => d.split('-').map((v, i) => i === 0 ? v : parseInt(v)).join('.')
      return `${fmt(filter.rangeStart)} ~ ${fmt(filter.rangeEnd)}`
    }
  }
}

function buildEntries(resultsData: (GameResult & { user: User })[]) {
  const map = new Map<string, RankingEntry>()
  for (const r of resultsData) {
    const u = r.user
    if (!u) continue
    if (!map.has(u.id)) map.set(u.id, { user: u, results: [], totalScore: 0, completedCount: 0, primaryStat: null })
    const entry = map.get(u.id)!
    entry.results.push(r)
    entry.totalScore += r.score ?? 0
    if (r.completed) entry.completedCount++
  }
  return map
}

function sortEntries(entries: RankingEntry[], selectedGameSlug: string | null, sortKey: SortKey) {
  if (selectedGameSlug === 'kkomanttle') {
    return [...entries].sort((a, b) =>
      a.results.reduce((s, r) => s + (r.attempts ?? 0), 0) -
      b.results.reduce((s, r) => s + (r.attempts ?? 0), 0)
    )
  }
  if (sortKey === 'score') return [...entries].sort((a, b) => b.totalScore - a.totalScore)
  return [...entries].sort((a, b) =>
    b.completedCount !== a.completedCount ? b.completedCount - a.completedCount : b.totalScore - a.totalScore
  )
}

function makeDefaultFilter(): FilterState {
  const today = kstToday()
  return { period: 'today', selectedMonth: kstTodayMonth(), rangeStart: today, rangeEnd: today, selectedGame: 'all' }
}

export default function RankingPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('global')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const [filter, setFilter] = useState<FilterState>(makeDefaultFilter)        // 시트 draft
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(makeDefaultFilter) // 실제 쿼리용
  const [sortKey, setSortKey] = useState<SortKey>('completed')
  const [globalEntries, setGlobalEntries] = useState<RankingEntry[]>([])
  const [friendEntries, setFriendEntries] = useState<RankingEntry[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data as Game[])
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const range = getDateRange(appliedFilter)

      let q = supabase.from('results').select('*, user:users(id, nickname, created_at)')
      if (range?.gte) q = q.gte('date', range.gte)
      if (range?.lte) q = q.lte('date', range.lte)
      const { data: globalData } = await q
      if (!cancelled && globalData) {
        setGlobalEntries(Array.from(buildEntries(globalData as (GameResult & { user: User })[]).values()))
      }

      if (user) {
        const { data: friendsData } = await supabase.from('friends').select('friend_id').eq('user_id', user.id)
        const friendIdList = (friendsData ?? []).map(f => f.friend_id)
        if (!cancelled) setFriendIds(new Set(friendIdList))
        const allIds = [user.id, ...friendIdList]
        let fq = supabase.from('results').select('*, user:users(id, nickname, created_at)').in('user_id', allIds)
        if (range?.gte) fq = fq.gte('date', range.gte)
        if (range?.lte) fq = fq.lte('date', range.lte)
        const { data: friendData } = await fq
        if (!cancelled && friendData) {
          setFriendEntries(Array.from(buildEntries(friendData as (GameResult & { user: User })[]).values()))
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [appliedFilter.period, appliedFilter.selectedMonth, appliedFilter.rangeStart, appliedFilter.rangeEnd, user])

  // 게임 필터·정렬은 appliedFilter 기준 (쿼리 불필요, 클라이언트 필터링)
  const selectedGameObj = games.find(g => g.id === appliedFilter.selectedGame)
  const selectedGameSlug = selectedGameObj?.slug ?? null
  const isKkomanttle = selectedGameSlug === 'kkomanttle'
  const activeFilterCount = (appliedFilter.period !== 'today' ? 1 : 0) + (appliedFilter.selectedGame !== 'all' ? 1 : 0)

  function filterByGame(entries: RankingEntry[]) {
    if (appliedFilter.selectedGame === 'all') return sortEntries(entries, null, sortKey)
    const filtered = entries
      .map(e => {
        const r = e.results.filter(r => r.game_id === appliedFilter.selectedGame)
        return { ...e, results: r, totalScore: r.reduce((s, r) => s + (r.score ?? 0), 0), completedCount: r.filter(r => r.completed).length }
      })
      .filter(e => e.results.length > 0)
    return sortEntries(filtered, selectedGameSlug, sortKey)
  }

  const shownEntries = tab === 'global' ? filterByGame(globalEntries) : filterByGame(friendEntries)

  function handleApply() {
    setAppliedFilter(filter)
    setSheetOpen(false)
  }

  function handleClear() {
    const reset = makeDefaultFilter()
    setFilter(reset)
    setAppliedFilter(reset)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">랭킹</h1>
      </div>

      <p className="text-sm text-gray-400 mb-4">{getPeriodLabel(appliedFilter)}</p>

      {/* 탭 + 정렬 + 필터 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('global')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70',
              tab === 'global' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            <Globe size={15} />전체
          </button>
          <button
            onClick={() => setTab('friends')}
            disabled={!user}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed',
              tab === 'friends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            )}
          >
            <Users size={15} />친구
          </button>
        </div>

        <div className="flex items-center gap-2">
          <SortDropdown value={sortKey} onChange={setSortKey} disabled={isKkomanttle} />
          <button
            onClick={() => { setFilter(appliedFilter); setSheetOpen(true) }}
            className={cn(
              'relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors active:opacity-70',
              activeFilterCount > 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            )}
          >
            <SlidersHorizontal size={15} />
            필터
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 flex items-center justify-center bg-blue-500 text-white text-[10px] font-black rounded-full px-1">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <RankingTable
          entries={shownEntries}
          games={games}
          currentUserId={user?.id}
          isKkomanttle={isKkomanttle}
          showDots={appliedFilter.selectedGame === 'all' && !isKkomanttle}
          friendIds={friendIds}
          onFriendChange={(userId, added) =>
            setFriendIds(prev => {
              const next = new Set(prev)
              added ? next.add(userId) : next.delete(userId)
              return next
            })
          }
        />
      )}

      <RankingFilterSheet
        open={sheetOpen}
        onClose={handleApply}
        onClear={handleClear}
        games={games}
        filter={filter}
        onChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
        todayStr={kstToday()}
      />
    </div>
  )
}
