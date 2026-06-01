'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: string        // YYYY-MM
  onChange: (v: string) => void
  maxMonth?: string    // YYYY-MM, 이 달 이후 선택 불가
}

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function MonthPicker({ value, onChange, maxMonth }: MonthPickerProps) {
  const [year, month] = value.split('-').map(Number)

  function setYear(y: number) {
    const newVal = `${y}-${String(month).padStart(2, '0')}`
    if (maxMonth && newVal > maxMonth) {
      const [maxY, maxM] = maxMonth.split('-').map(Number)
      onChange(`${maxY}-${String(maxM).padStart(2, '0')}`)
    } else {
      onChange(newVal)
    }
  }

  function selectMonth(m: number) {
    const newVal = `${year}-${String(m).padStart(2, '0')}`
    if (maxMonth && newVal > maxMonth) return
    onChange(newVal)
  }

  const maxYear = maxMonth ? Number(maxMonth.split('-')[0]) : new Date().getFullYear()

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      {/* 연도 선택 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setYear(year - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors active:opacity-70"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <span className="text-base font-bold text-gray-900">{year}년</span>
        <button
          onClick={() => setYear(year + 1)}
          disabled={year >= maxYear}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 transition-colors active:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* 월 그리드 */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1
          const monthStr = `${year}-${String(m).padStart(2, '0')}`
          const isSelected = m === month
          const isDisabled = !!(maxMonth && monthStr > maxMonth)

          return (
            <button
              key={m}
              onClick={() => selectMonth(m)}
              disabled={isDisabled}
              className={cn(
                'py-2 rounded-xl text-sm font-semibold transition-colors active:opacity-70',
                isSelected
                  ? 'bg-gray-900 text-white'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
