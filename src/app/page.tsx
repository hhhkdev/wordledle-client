'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult, User } from '@/types'
import GameCard from '@/components/game/GameCard'
import Link from 'next/link'
import { LogIn, Trophy, ChevronRight, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankingEntry {
  user: User
  completedCount: number
  totalScore: number
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [results, setResults] = useState<Record<string, GameResult>>({})
  const [topRanking, setTopRanking] = useState<RankingEntry[]>([])
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
    if (!user || games.length === 0) return
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

  // 오늘 전체 랭킹 상위 3명
  useEffect(() => {
    async function fetchTopRanking() {
      const supabase = createClient()
      const { data } = await supabase
        .from('results')
        .select('user_id, score, completed, user:users(id, nickname, created_at)')
        .eq('date', today)
      if (!data) return
      const map = new Map<string, RankingEntry>()
      for (const r of data) {
        const u = (Array.isArray(r.user) ? r.user[0] : r.user) as User
        if (!u) continue
        if (!map.has(u.id)) map.set(u.id, { user: u, completedCount: 0, totalScore: 0 })
        const e = map.get(u.id)!
        e.totalScore += r.score ?? 0
        if (r.completed) e.completedCount++
      }
      const sorted = Array.from(map.values())
        .sort((a, b) => b.completedCount !== a.completedCount ? b.completedCount - a.completedCount : b.totalScore - a.totalScore)
        .slice(0, 3)
      setTopRanking(sorted)
    }
    fetchTopRanking()
  }, [today])

  const todayStr = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const completedCount = Object.values(results).filter(r => r.completed).length
  const totalGames = games.length

  const RANK_MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-1">{todayStr}</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">오늘의 워들</h1>
          </div>
          {user && totalGames > 0 && (
            <Link
              href="/ranking"
              className="flex flex-col items-center gap-0.5 bg-white rounded-2xl px-5 py-3 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
            >
              <div className="flex items-end gap-0.5 leading-none">
                <span className="text-2xl font-black text-gray-900">{completedCount}</span>
                <span className="text-lg font-bold text-gray-300 mb-0.5">/{totalGames}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <Trophy size={11} />완료
              </div>
            </Link>
          )}
        </div>

        {!authLoading && !user && (
          <div className="mt-4 flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">결과를 기록하고 친구들과 경쟁해보세요</p>
              <p className="text-xs text-gray-400 mt-0.5">로그인하면 랭킹과 친구 기능을 이용할 수 있어요</p>
            </div>
            <Link href="/login" className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors">
              <LogIn size={14} />로그인
            </Link>
          </div>
        )}

        {user && totalGames > 0 && completedCount === totalGames && (
          <div className="mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <span className="text-xl">🎉</span>
            <p className="text-sm font-bold text-green-800">오늘 모든 게임을 완료했어요!</p>
          </div>
        )}
      </div>

      {/* Game grid */}
      {loadingGames ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              result={results[game.id] ?? null}
              onResultChange={r => setResults(prev => ({ ...prev, [r.game_id]: r }))}
            />
          ))}
        </div>
      )}

      {/* ── 하단 섹션 ── */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 오늘의 랭킹 미리보기 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              오늘의 랭킹
            </h2>
            <Link href="/ranking" className="flex items-center gap-0.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
              전체보기 <ChevronRight size={13} />
            </Link>
          </div>
          {topRanking.length === 0 ? (
            <div className="text-center py-6 text-gray-300 text-sm">아직 결과가 없어요</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topRanking.map((entry, idx) => (
                <div
                  key={entry.user.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                    entry.user.id === user?.id ? 'bg-gray-900' : 'bg-gray-50'
                  )}
                >
                  <span className="text-base w-5 text-center">{RANK_MEDAL[idx]}</span>
                  <span className={cn('flex-1 text-sm font-bold', entry.user.id === user?.id ? 'text-white' : 'text-gray-800')}>
                    {entry.user.nickname}
                    {entry.user.id === user?.id && <span className="ml-1 text-xs text-white/50 font-normal">나</span>}
                  </span>
                  <span className={cn('text-xs font-semibold', entry.user.id === user?.id ? 'text-white/60' : 'text-gray-400')}>
                    {entry.completedCount}/{totalGames} · {entry.totalScore}점
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 내 최근 기록 (로그인 시) / 로그인 유도 (비로그인 시) */}
        {user ? (
          <MyRecentRecord userId={user.id} games={games} today={today} results={results} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-3xl">📊</p>
            <p className="text-sm font-bold text-gray-700">나의 기록을 확인하세요</p>
            <p className="text-xs text-gray-400">로그인하면 게임별 통계와 연속 완료 기록을 볼 수 있어요</p>
            <Link href="/login" className="mt-1 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors">
              로그인하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// 내 오늘 게임별 완료 현황
function MyRecentRecord({
  userId, games, today, results
}: {
  userId: string
  games: Game[]
  today: string
  results: Record<string, GameResult>
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-black text-gray-900">오늘 내 현황</h2>
        <Link href="/mypage" className="flex items-center gap-0.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
          전체기록 <ChevronRight size={13} />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {games.map(game => {
          const r = results[game.id]
          return (
            <div key={game.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
              <span className="text-base w-6 text-center">{game.emoji}</span>
              <span className="flex-1 text-sm font-semibold text-gray-700">{game.name}</span>
              <div className="flex items-center gap-1.5">
                {r ? (
                  r.completed ? (
                    <>
                      {r.attempts !== null && (
                        <span className="text-xs text-gray-400">
                          {r.attempts}{r.max_attempts ? `/${r.max_attempts}` : ''}회
                        </span>
                      )}
                      <CheckCircle2 size={15} className="text-green-500" />
                    </>
                  ) : (
                    <XCircle size={15} className="text-red-400" />
                  )
                ) : (
                  <Minus size={15} className="text-gray-300" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
