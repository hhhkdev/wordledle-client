'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface DayPickerProps {
  onChange: (date: string) => void
  minDate?: string
  maxDate?: string
  rangeStart?: string   // range highlight start (dark bg)
  rangeEnd?: string     // range highlight end (dark bg)
  defaultView?: string  // YYYY-MM-DD to initialize the month view
}

function kstToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

export default function DayPicker({ onChange, minDate, maxDate, rangeStart, rangeEnd, defaultView }: DayPickerProps) {
  const init = defaultView || rangeStart || kstToday()
  const [viewYear, setViewYear] = useState(() => parseInt(init.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(init.slice(5, 7)) - 1) // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()
  const today = kstToday()

  type Cell = { day: number; date: string; inMonth: boolean }
  const cells: Cell[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const pm = viewMonth === 0 ? 12 : viewMonth
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ day: d, inMonth: false, date: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  const rows = Math.ceil(cells.length / 7)
  for (let d = 1; d <= rows * 7 - cells.length; d++) {
    const nm = viewMonth === 11 ? 1 : viewMonth + 2
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ day: d, inMonth: false, date: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const nextMonthYM = viewMonth === 11
    ? `${viewYear + 1}-01`
    : `${viewYear}-${String(viewMonth + 2).padStart(2, '0')}`
  const canGoNext = !maxDate || nextMonthYM <= maxDate.slice(0, 7)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors active:opacity-70"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-900">{viewYear}년 {viewMonth + 1}월</span>
        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors active:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={cn(
            'text-center text-xs font-semibold py-1',
            i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
          )}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const col = i % 7
          const isRangeStart = cell.date === rangeStart
          const isRangeEnd = cell.date === rangeEnd
          const hasRange = rangeStart && rangeEnd && rangeStart !== rangeEnd
          const isInRange = hasRange && cell.date > rangeStart! && cell.date < rangeEnd!
          const isToday = cell.date === today
          const isDisabled = !cell.inMonth
            || (!!minDate && cell.date < minDate)
            || (!!maxDate && cell.date > maxDate)

          return (
            <button
              key={i}
              onClick={() => !isDisabled && onChange(cell.date)}
              disabled={isDisabled}
              className={cn(
                'h-9 w-full flex items-center justify-center text-sm rounded-xl transition-colors',
                isRangeStart || isRangeEnd
                  ? 'bg-gray-900 text-white font-bold'
                  : isInRange
                  ? 'bg-gray-100 text-gray-800 font-semibold'
                  : isToday
                  ? 'text-blue-500 font-bold hover:bg-gray-100'
                  : isDisabled
                  ? 'text-gray-200 cursor-not-allowed'
                  : col === 0
                  ? 'text-red-400 hover:bg-gray-100'
                  : col === 6
                  ? 'text-blue-400 hover:bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
