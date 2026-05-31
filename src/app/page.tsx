'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Game, GameResult } from '@/types'
import GameCard from '@/components/game/GameCard'
import Link from 'next/link'
import { LogIn, Trophy } from 'lucide-react'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [results, setResults] = useState<Record<string, GameResult>>({})
  const [loadingGames, setLoadingGames] = useState(true)

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
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('results')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
      if (data) {
        const map: Record<string, GameResult> = {}
        for (const r of data) map[r.game_id] = r
        setResults(map)
      }
    }
    fetchTodayResults()
  }, [user, games])

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  const completedCount = Object.values(results).filter(r => r.completed).length
  const totalGames = games.length

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-gray-400 mb-1">{today}</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
              오늘의 워들
            </h1>
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
                <Trophy size={11} />
                완료
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
            <Link
              href="/login"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
            >
              <LogIn size={14} />
              로그인
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  )
}
