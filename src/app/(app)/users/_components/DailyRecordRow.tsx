'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameResult, Game } from '@/types'

export interface DailyRecord {
  date: string
  results: (GameResult & { game: Game })[]
  completedCount: number
  totalScore: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  })
}

export default function DailyRecordRow({
  record, games, isToday,
}: {
  record: DailyRecord; games: Game[]; isToday: boolean
}) {
  const [open, setOpen] = useState(isToday)
  return (
    <div className={cn('bg-white rounded-2xl border overflow-hidden', isToday ? 'border-gray-300' : 'border-gray-200')}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700">{formatDate(record.date)}</span>
          {isToday && <span className="text-xs font-semibold bg-gray-900 text-white px-2 py-0.5 rounded-full">오늘</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {games.map(game => {
              const r = record.results.find(r => r.game_id === game.id)
              return (
                <div
                  key={game.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: r ? game.color + '33' : '#f3f4f6' }}
                  title={game.name}
                >
                  {r?.completed
                    ? <CheckCircle2 size={12} style={{ color: game.color }} />
                    : r
                    ? <XCircle size={12} className="text-red-400" />
                    : <Minus size={10} className="text-gray-300" />}
                </div>
              )
            })}
          </div>
          <span className="text-xs font-bold text-gray-500">{record.completedCount}/{games.length}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          {record.results.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">{r.game?.name}</span>
              <div className="flex items-center gap-2">
                {r.completed ? (
                  <>
                    {r.attempts !== null && (
                      <span className="text-xs text-gray-500">
                        {r.attempts}{r.max_attempts ? `/${r.max_attempts}` : ''}회
                      </span>
                    )}
                    <span className="text-xs font-bold text-gray-900">{r.score}점</span>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </>
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
