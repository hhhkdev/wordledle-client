'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import DayPicker from './DayPicker'

interface DateRangePickerProps {
  start: string      // YYYY-MM-DD
  end: string        // YYYY-MM-DD
  maxDate?: string
  onChange: (start: string, end: string) => void
}

function fmt(d: string) {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${y}. ${parseInt(m)}. ${parseInt(day)}.`
}

export default function DateRangePicker({ start, end, maxDate, onChange }: DateRangePickerProps) {
  const [active, setActive] = useState<'start' | 'end'>('start')

  function handleSelect(date: string) {
    if (active === 'start') {
      const newEnd = date > end ? date : end
      onChange(date, newEnd)
      setActive('end')
    } else {
      const newEnd = date < start ? start : date
      onChange(start, newEnd)
    }
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      {/* Field tabs */}
      <div className="flex gap-2 mb-4">
        {(['start', 'end'] as const).map(field => (
          <button
            key={field}
            onClick={() => setActive(field)}
            className={cn(
              'flex-1 px-3 py-2.5 rounded-xl text-sm text-left transition-colors',
              active === field
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700'
            )}
          >
            <p className={cn('text-[10px] font-semibold mb-0.5', active === field ? 'text-gray-400' : 'text-gray-400')}>
              {field === 'start' ? '시작일' : '종료일'}
            </p>
            <span className="font-bold">{fmt(field === 'start' ? start : end)}</span>
          </button>
        ))}
      </div>

      <DayPicker
        onChange={handleSelect}
        minDate={active === 'end' ? start : undefined}
        maxDate={maxDate}
        rangeStart={start}
        rangeEnd={end}
        defaultView={active === 'start' ? start : end}
      />
    </div>
  )
}
