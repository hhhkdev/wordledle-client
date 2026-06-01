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
type RangePeriod = 'today' | 'week' | 'month' | 'date' | 'all'

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

function getDateRange(period: RangePeriod, selectedDate: string) {
  const today = kstToday()
  switch (period) {
    case 'today': return { gte: today, lte: today }
    case 'week': {
      const d = new Date(Date.now() - 6 * 86400000)
      return { gte: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) }
    }
    case 'month': {
      const d = new Date(Date.now() - 29 * 86400000)
      return { gte: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) }
    }
    case 'date': return { gte: selectedDate, lte: selectedDate }
    case 'all': return null
  }
}

function getPeriodLabel(period: RangePeriod, selectedDate: string): string {
  const todayLabel = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })
  switch (period) {
    case 'today': return `오늘 (${todayLabel}) 기준`
    case 'week': return '최근 7일 기준'
    case 'month': return '최근 30일 기준'
    case 'date': {
      const [y, m, d] = selectedDate.split('-')
      return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 기준`
    }
    case 'all': return '전체 기간 누적'
  }
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
  if (selectedGameSlug === 'kkomanttle') {
    return [...entries].sort((a, b) => {
      const aA = a.results.reduce((s, r) => s + (r.attempts ?? 0), 0)
      const bA = b.results.reduce((s, r) => s + (r.attempts ?? 0), 0)
      return aA - bA
    })
  }
  if (sortKey === 'score') return [...entries].sort((a, b) => b.totalScore - a.totalScore)
  return [...entries].sort((a, b) =>
    b.completedCount !== a.completedCount ? b.completedCount - a.completedCount : b.totalScore - a.totalScore
  )
}

const PERIOD_OPTIONS: { key: RangePeriod; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'date', label: '날짜별' },
  { key: 'all', label: '전체' },
]

export default function RankingPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('global')
  const [sortKey, setSortKey] = useState<SortKey>('completed')
  const [period, setPeriod] = useState<RangePeriod>('today')
  const [selectedDate, setSelectedDate] = useState(kstToday())
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [globalEntries, setGlobalEntries] = useState<RankingEntry[]>([])
  const [friendEntries, setFriendEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  // 게임 목록은 한 번만 로드
  useEffect(() => {
    createClient().from('games').select('*').order('name').then(({ data }) => {
      if (data) setGames(data as Game[])
    })
  }, [])

  // 기간/날짜/유저 변경 시 랭킹 재조회
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const supabase = createClient()
      const range = getDateRange(period, selectedDate)

      // 전체 랭킹
      let q = supabase.from('results').select('*, user:users(id, nickname, created_at)')
      if (range?.gte) q = q.gte('date', range.gte)
      if (range?.lte) q = q.lte('date', range.lte)
      const { data: globalData } = await q

      if (!cancelled && globalData) {
        const map = buildEntries(globalData as (GameResult & { user: User })[])
        setGlobalEntries(Array.from(map.values()))
      }

      // 친구 랭킹
      if (user) {
        const { data: friendsData } = await supabase
          .from('friends').select('friend_id').eq('user_id', user.id)
        const friendIds = (friendsData ?? []).map(f => f.friend_id)
        const allIds = [user.id, ...friendIds]

        let fq = supabase.from('results').select('*, user:users(id, nickname, created_at)').in('user_id', allIds)
        if (range?.gte) fq = fq.gte('date', range.gte)
        if (range?.lte) fq = fq.lte('date', range.lte)
        const { data: friendData } = await fq

        if (!cancelled && friendData) {
          const map = buildEntries(friendData as (GameResult & { user: User })[])
          setFriendEntries(Array.from(map.values()))
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [period, selectedDate, user])

  const selectedGameObj = games.find(g => g.id === selectedGame)
  const selectedGameSlug = selectedGameObj?.slug ?? null
  const isKkomanttle = selectedGameSlug === 'kkomanttle'

  function filterByGame(entries: RankingEntry[]): RankingEntry[] {
    if (selectedGame === 'all') return sortEntries(entries, null, sortKey)
    const filtered = entries
      .map(e => {
        const gameResults = e.results.filter(r => r.game_id === selectedGame)
        return {
          ...e,
          results: gameResults,
          totalScore: gameResults.reduce((s, r) => s + (r.score ?? 0), 0),
          completedCount: gameResults.filter(r => r.completed).length,
        }
      })
      .filter(e => e.results.length > 0)
    return sortEntries(filtered, selectedGameSlug, sortKey)
  }

  const shownEntries = tab === 'global' ? filterByGame(globalEntries) : filterByGame(friendEntries)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">랭킹</h1>
        <p className="text-sm text-gray-400 mt-1">{getPeriodLabel(period, selectedDate)}</p>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 -mx-4 px-4">
        {PERIOD_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors active:opacity-70',
              period === key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 날짜 선택 (날짜별 모드) */}
      {period === 'date' && (
        <div className="mb-4">
          <input
            type="date"
            value={selectedDate}
            max={kstToday()}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      )}

      {/* 게임 필터 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4">
        <button
          onClick={() => setSelectedGame('all')}
          className={cn(
            'shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors active:opacity-70',
            selectedGame === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'
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
              selectedGame === g.id ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'
            )}
            style={selectedGame === g.id ? { backgroundColor: g.color } : undefined}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {/* 탭 + 정렬 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-3">
        <button
          onClick={() => setTab('global')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70',
            tab === 'global' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          <Globe size={15} />전체 랭킹
        </button>
        <button
          onClick={() => setTab('friends')}
          disabled={!user}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed',
            tab === 'friends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          )}
        >
          <Users size={15} />친구 랭킹
        </button>
      </div>

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
            <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <RankingTable entries={shownEntries} currentUserId={user?.id} isKkomanttle={isKkomanttle} />
      )}
    </div>
  )
}
