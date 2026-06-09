'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  results: { date: string; score: number }[]
}

function scoreToLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0)  return 0
  if (score <= 20) return 1
  if (score <= 45) return 2
  if (score <= 69) return 3
  return 4
}

const LEVEL_COLORS = [
  'bg-gray-100',
  'bg-green-100',
  'bg-green-300',
  'bg-green-500',
  'bg-green-700',
]

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function ActivityCalendar({ results }: Props) {
  const { weeks, months } = useMemo(() => {
    const scoreByDate = new Map<string, number>()
    for (const r of results) {
      scoreByDate.set(r.date, (scoreByDate.get(r.date) ?? 0) + r.score)
    }

    // 오늘 기준 91일 (13주) — 일요일부터 시작
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // 이번 주 토요일까지 채우기 위해 토요일 기준으로 끝
    const endDay = new Date(today)
    endDay.setDate(today.getDate() + (6 - today.getDay()))

    const startDay = new Date(endDay)
    startDay.setDate(endDay.getDate() - 91 + 1)

    const days: { date: string; level: 0 | 1 | 2 | 3 | 4; score: number }[] = []
    const cur = new Date(startDay)
    while (cur <= endDay) {
      const dateStr = cur.toLocaleDateString('en-CA')
      const score = scoreByDate.get(dateStr) ?? 0
      days.push({ date: dateStr, level: scoreToLevel(score), score })
      cur.setDate(cur.getDate() + 1)
    }

    // 13열(주)로 묶기
    const cols: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7))

    // 월 레이블 (각 열 첫 날 기준)
    const monthLabels: { col: number; label: string }[] = []
    let lastMonth = -1
    for (let c = 0; c < cols.length; c++) {
      const m = new Date(cols[c][0].date + 'T00:00:00').getMonth()
      if (m !== lastMonth) {
        monthLabels.push({ col: c, label: `${m + 1}월` })
        lastMonth = m
      }
    }

    return { weeks: cols, months: monthLabels }
  }, [results])

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* 월 레이블 */}
        <div className="flex mb-1 ml-7">
          {weeks.map((_, ci) => {
            const m = months.find(m => m.col === ci)
            return (
              <div key={ci} className="w-4 shrink-0 mr-0.5">
                {m && <span className="text-[10px] text-gray-400 font-medium">{m.label}</span>}
              </div>
            )
          })}
        </div>

        <div className="flex gap-0.5">
          {/* 요일 레이블 */}
          <div className="flex flex-col gap-0.5 mr-1 w-6 shrink-0">
            {DAYS.map((d, i) => (
              <div key={d} className="w-4 h-4 flex items-center justify-center">
                {i % 2 === 1 && <span className="text-[9px] text-gray-400">{d}</span>}
              </div>
            ))}
          </div>

          {/* 격자 */}
          {weeks.map((week, ci) => (
            <div key={ci} className="flex flex-col gap-0.5">
              {week.map(day => (
                <div
                  key={day.date}
                  title={`${day.date}${day.score > 0 ? ` · ${day.score}점` : ''}`}
                  className={cn('w-4 h-4 rounded-sm', LEVEL_COLORS[day.level])}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-1.5 mt-2 ml-7">
          <span className="text-[10px] text-gray-400">적음</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} className={cn('w-3 h-3 rounded-sm', c)} />
          ))}
          <span className="text-[10px] text-gray-400">많음</span>
        </div>
      </div>
    </div>
  )
}
