'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import GameCard from '@/components/game/GameCard'
import Announcements from '@/components/Announcements'
import Link from 'next/link'
import { LogIn, Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankingEntry {
  user: User
  completedCount: number
  totalScore: number
}

interface RoundInfo {
  gameId: string
  puzzleNumber: number
}

const RANK_MEDAL = ['🥇', '🥈', '🥉']

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [results, setResults] = useState<Record<string, GameResult>>({})
  const [topRanking, setTopRanking] = useState<RankingEntry[]>([])
  const [currentRounds, setCurrentRounds] = useState<RoundInfo[]>([])
  const [loadingGames, setLoadingGames] = useState(true)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function fetchGames() {
      const supabase = createClient()
      const { data } = await supabase.from('games').select('*').order('name')
      if (data) setGames(data as Game[])
      setLoadingGames(false)
    }
    fetchGames()
  }, [])

  useEffect(() => {
    if (!user) {
      setResults({})
      return
    }
    if (games.length === 0) return
    async function fetchTodayResults() {
      const supabase = createClient()
      const { data } = await supabase
        .from('results').select('*').eq('user_id', user!.id).eq('date', today)
      if (data) {
        const map: Record<string, GameResult> = {}
        for (const r of data) map[r.game_id] = r
        setResults(map)
      }
    }
    fetchTodayResults()
  }, [user, games, today])

  useEffect(() => {
    async function fetchTopRanking() {
      const supabase = createClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('results')
        .select('user_id, game_id, score, completed, puzzle_number, user:users(id, nickname, created_at, is_admin)')
        .gte('date', sevenDaysAgo)
        .not('puzzle_number', 'is', null)
      if (!data) return

      // 게임별 최신 회차 번호 찾기
      const latestByGame = new Map<string, number>()
      for (const r of data) {
        if (r.puzzle_number == null) continue
        const cur = latestByGame.get(r.game_id) ?? 0
        if (r.puzzle_number > cur) latestByGame.set(r.game_id, r.puzzle_number)
      }

      setCurrentRounds(
        Array.from(latestByGame.entries()).map(([gameId, puzzleNumber]) => ({ gameId, puzzleNumber }))
      )

      // 최신 회차 결과만 집계
      const map = new Map<string, RankingEntry>()
      for (const r of data) {
        if (r.puzzle_number == null) continue
        if (latestByGame.get(r.game_id) !== r.puzzle_number) continue
        const u = (Array.isArray(r.user) ? r.user[0] : r.user) as User
        if (!u) continue
        if (!map.has(u.id)) map.set(u.id, { user: u, completedCount: 0, totalScore: 0 })
        const e = map.get(u.id)!
        e.totalScore += r.score ?? 0
        if (r.completed) e.completedCount++
      }
      const sorted = Array.from(map.values())
        .sort((a, b) => b.completedCount !== a.completedCount
          ? b.completedCount - a.completedCount
          : b.totalScore - a.totalScore)
        .slice(0, 5)
      setTopRanking(sorted)
    }
    fetchTopRanking()
  }, [])

  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const completedCount = Object.values(results).filter(r => r.completed).length
  const totalGames = games.length

  return (
    <div>
      {/* 날짜 + 완료 현황 */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-gray-400">{todayStr}</p>
        {user && totalGames > 0 && (
          <span className="text-sm font-bold text-gray-500">
            <span className="text-gray-900">{completedCount}</span>/{totalGames} 완료
          </span>
        )}
      </div>

      {/* 로그인 유도 */}
      {!authLoading && !user && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">결과를 기록하고 친구들과 경쟁해보세요</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">로그인하면 랭킹과 친구 기능을 이용할 수 있어요</p>
          </div>
          <Link href="/login" className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl active:bg-gray-700 transition-colors">
            <LogIn size={14} />
            <span className="hidden sm:inline">로그인</span>
          </Link>
        </div>
      )}

      {user && totalGames > 0 && completedCount === totalGames && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-3 mb-5">
          <span className="text-lg">🎉</span>
          <p className="text-sm font-bold text-green-800">오늘 모든 게임을 완료했어요!</p>
        </div>
      )}

      {/* Game grid: 모바일 1열, sm 이상 2열 */}
      {loadingGames ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...games]
            .sort((a, b) => {
              // 로그인 유저: 결과 입력한 게임은 하단
              if (!user) return 0
              const aHas = !!results[a.id]
              const bHas = !!results[b.id]
              if (aHas === bHas) return 0
              return aHas ? 1 : -1
            })
            .map(game => (
              <GameCard
                key={game.id}
                game={game}
                result={results[game.id] ?? null}
                onResultChange={r => setResults(prev => ({ ...prev, [r.game_id]: r }))}
              />
            ))}
        </div>
      )}

      {/* 이번 회차 랭킹 — 전체 너비 */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            이번 회차 랭킹
          </h2>
          <Link href="/ranking" className="flex items-center gap-0.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            전체보기 <ChevronRight size={14} />
          </Link>
        </div>
        {currentRounds.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {currentRounds
              .map(r => {
                const g = games.find(g => g.id === r.gameId)
                if (!g) return null
                // 한국 게임은 자정 기준 초기화 → 날짜 표시, 해외 게임은 회차 번호
                const isKorean = g.slug !== 'wordle'
                if (isKorean) {
                  const dateStr = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
                  return `${g.emoji} ${dateStr}`
                }
                return `${g.emoji} #${r.puzzleNumber}`
              })
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {currentRounds.length === 0 && <div className="mb-3" />}

        {topRanking.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-10 text-center text-gray-300 text-sm">
            아직 이번 회차 결과가 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 1등 강조 카드 */}
            {topRanking[0] && (() => {
              const e = topRanking[0]
              const isMe = e.user.id === user?.id
              return (
                <div className={cn(
                  'flex items-center gap-4 px-5 py-4 rounded-2xl border-2',
                  isMe ? 'bg-blue-50 border-blue-300' : 'bg-yellow-50 border-yellow-300'
                )}>
                  <span className="text-3xl">🥇</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-lg font-black truncate', isMe ? 'text-blue-800' : 'text-gray-900')}>
                      {e.user.nickname}
                      {isMe && <span className="ml-1.5 text-sm text-blue-400 font-normal">나</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-2xl font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {e.totalScore}<span className={cn('text-sm font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    </p>
                    <p className={cn('text-xs mt-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>{e.completedCount}/{totalGames}</p>
                  </div>
                </div>
              )
            })()}

            {/* 2~5등 */}
            {topRanking.slice(1).map((entry, idx) => {
              const rank = idx + 2
              const isMe = entry.user.id === user?.id
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-2xl border',
                    isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  )}
                >
                  <span className="text-lg w-6 text-center">
                    {rank <= 3 ? RANK_MEDAL[rank - 1] : <span className="text-sm font-bold text-gray-400">{rank}</span>}
                  </span>
                  <span className={cn('flex-1 text-sm font-bold truncate', isMe ? 'text-blue-800' : 'text-gray-800')}>
                    {entry.user.nickname}
                    {isMe && <span className="ml-1 text-xs text-blue-400 font-normal">나</span>}
                  </span>
                  <div className="text-right shrink-0">
                    <p className={cn('text-base font-black tabular-nums', isMe ? 'text-blue-700' : 'text-gray-900')}>
                      {entry.totalScore}<span className={cn('text-xs font-semibold ml-0.5', isMe ? 'text-blue-400' : 'text-gray-400')}>점</span>
                    </p>
                    <p className={cn('text-xs', isMe ? 'text-blue-400' : 'text-gray-400')}>
                      {entry.completedCount}/{totalGames}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 공지사항 */}
      <Announcements />
    </div>
  )
}
