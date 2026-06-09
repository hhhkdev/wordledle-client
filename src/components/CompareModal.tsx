'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { GameResult, Game, User } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  me: User
  other: User
  otherResults: (GameResult & { game?: Game })[]
  games: Game[]
  onClose: () => void
}

interface StatRow {
  label: string
  myVal: string
  otherVal: string
  myWins: boolean
  otherWins: boolean
}

function buildStats(
  results: (GameResult & { game?: Game })[],
  games: Game[],
): {
  totalScore: number
  activeDays: number
  avgDaily: number
  byGame: Record<string, { score: number; completed: number }>
} {
  const byDate: Record<string, number> = {}
  for (const r of results) {
    byDate[r.date] = (byDate[r.date] ?? 0) + (r.score ?? 0)
  }
  const daily = Object.values(byDate)
  const activeDays = daily.length
  const totalScore = results.reduce((s, r) => s + (r.score ?? 0), 0)
  const avgDaily = activeDays > 0
    ? Math.round(daily.reduce((a, b) => a + b, 0) / activeDays * 10) / 10
    : 0

  const byGame: Record<string, { score: number; completed: number }> = {}
  for (const g of games) {
    const rs = results.filter(r => r.game_id === g.id)
    byGame[g.id] = {
      score: rs.reduce((s, r) => s + (r.score ?? 0), 0),
      completed: rs.filter(r => r.completed).length,
    }
  }
  return { totalScore, activeDays, avgDaily, byGame }
}

// 최근 14일 날짜 배열
function recentDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  }).reverse()
}

export default function CompareModal({ me, other, otherResults, games, onClose }: Props) {
  const [myResults, setMyResults] = useState<(GameResult & { game?: Game })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient()
      .from('results').select('*, game:games(*)')
      .eq('user_id', me.id)
      .then(({ data }) => {
        setMyResults((data ?? []) as (GameResult & { game?: Game })[])
        setLoading(false)
      })
  }, [me.id])

  const myStats    = buildStats(myResults, games)
  const otherStats = buildStats(otherResults, games)

  const summaryRows: StatRow[] = [
    {
      label: '총 점수',
      myVal: `${myStats.totalScore.toLocaleString()}점`,
      otherVal: `${otherStats.totalScore.toLocaleString()}점`,
      myWins: myStats.totalScore > otherStats.totalScore,
      otherWins: otherStats.totalScore > myStats.totalScore,
    },
    {
      label: '활동일',
      myVal: `${myStats.activeDays}일`,
      otherVal: `${otherStats.activeDays}일`,
      myWins: myStats.activeDays > otherStats.activeDays,
      otherWins: otherStats.activeDays > myStats.activeDays,
    },
    {
      label: '일평균',
      myVal: `${myStats.avgDaily}점`,
      otherVal: `${otherStats.avgDaily}점`,
      myWins: myStats.avgDaily > otherStats.avgDaily,
      otherWins: otherStats.avgDaily > myStats.avgDaily,
    },
  ]

  // 최근 14일 날짜별 승패
  const dates14 = recentDates(14)
  const myByDate: Record<string, number> = {}
  for (const r of myResults) myByDate[r.date] = (myByDate[r.date] ?? 0) + (r.score ?? 0)
  const otherByDate: Record<string, number> = {}
  for (const r of otherResults) otherByDate[r.date] = (otherByDate[r.date] ?? 0) + (r.score ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-black text-gray-900">1:1 비교</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* 이름 헤더 */}
          <div className="grid grid-cols-3 text-center">
            <p className="text-sm font-black text-blue-600 truncate">{me.nickname}</p>
            <p className="text-xs text-gray-400 self-center">VS</p>
            <p className="text-sm font-black text-gray-900 truncate">{other.nickname}</p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* 요약 통계 */}
              <div className="flex flex-col gap-2">
                {summaryRows.map(row => (
                  <div key={row.label} className="grid grid-cols-3 items-center gap-2">
                    <div className={cn(
                      'text-right px-3 py-2 rounded-xl text-sm font-black tabular-nums',
                      row.myWins ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500',
                    )}>{row.myVal}</div>
                    <p className="text-[11px] text-gray-400 text-center font-medium">{row.label}</p>
                    <div className={cn(
                      'text-left px-3 py-2 rounded-xl text-sm font-black tabular-nums',
                      row.otherWins ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500',
                    )}>{row.otherVal}</div>
                  </div>
                ))}
              </div>

              {/* 게임별 비교 */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">게임별</p>
                <div className="flex flex-col gap-1.5">
                  {games.map(g => {
                    const my = myStats.byGame[g.id]
                    const ot = otherStats.byGame[g.id]
                    const myWins = (my?.score ?? 0) > (ot?.score ?? 0)
                    const otWins = (ot?.score ?? 0) > (my?.score ?? 0)
                    return (
                      <div key={g.id} className="grid grid-cols-3 items-center gap-2">
                        <span className={cn(
                          'text-right text-sm font-bold tabular-nums px-2 py-1.5 rounded-lg',
                          myWins ? 'text-blue-600 bg-blue-50' : 'text-gray-400',
                        )}>{my?.score ?? 0}점</span>
                        <span className="text-[11px] text-gray-500 text-center truncate">{g.name}</span>
                        <span className={cn(
                          'text-left text-sm font-bold tabular-nums px-2 py-1.5 rounded-lg',
                          otWins ? 'text-gray-900 bg-gray-100' : 'text-gray-400',
                        )}>{ot?.score ?? 0}점</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 최근 14일 승패 */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">최근 14일</p>
                <div className="flex gap-1">
                  {dates14.map(d => {
                    const my = myByDate[d] ?? 0
                    const ot = otherByDate[d] ?? 0
                    const hasActivity = my > 0 || ot > 0
                    const myWins = my > ot
                    const draw = my === ot && hasActivity
                    return (
                      <div key={d} title={`${d.slice(5)}\n나 ${my}점 / ${other.nickname} ${ot}점`}
                        className={cn(
                          'flex-1 h-7 rounded',
                          !hasActivity ? 'bg-gray-100' :
                          draw        ? 'bg-yellow-200' :
                          myWins      ? 'bg-blue-400'   : 'bg-gray-400',
                        )}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-400 inline-block" />내가 앞섬</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-400 inline-block" />{other.nickname} 앞섬</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-yellow-200 inline-block" />동점</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
