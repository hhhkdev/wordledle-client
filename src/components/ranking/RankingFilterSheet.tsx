'use client'

import { useEffect, useRef } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import { Game } from '@/types'
import { cn } from '@/lib/utils'
import MonthPicker from './MonthPicker'
import DateRangePicker from './DateRangePicker'

export type RangePeriod = 'all' | 'today' | 'month' | 'range'

export interface FilterState {
  period: RangePeriod
  selectedMonth: string   // YYYY-MM
  rangeStart: string      // YYYY-MM-DD
  rangeEnd: string        // YYYY-MM-DD
  selectedGame: string
}

interface RankingFilterSheetProps {
  open: boolean
  onClose: () => void
  onClear: () => void
  games: Game[]
  filter: FilterState
  onChange: (patch: Partial<FilterState>) => void
  todayStr: string
}

const PERIOD_OPTIONS: { key: RangePeriod; label: string }[] = [
  { key: 'all', label: '누적' },
  { key: 'today', label: '오늘' },
  { key: 'month', label: '매월' },
  { key: 'range', label: '기간 설정' },
]

export default function RankingFilterSheet({
  open,
  onClose,
  onClear,
  games,
  filter,
  onChange,
  todayStr,
}: RankingFilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const hasActiveFilters = filter.period !== 'today' || filter.selectedGame !== 'all'
  const todayMonth = todayStr.slice(0, 7)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl transition-transform duration-300 ease-out max-w-lg mx-auto',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
            <SlidersHorizontal size={16} />
            필터
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onClear}
                className="text-sm font-semibold text-blue-500 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                초기화
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
          {/* 기간 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">기간</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PERIOD_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onChange({ period: key })}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                    filter.period === key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {filter.period === 'month' && (
              <MonthPicker
                value={filter.selectedMonth}
                onChange={v => onChange({ selectedMonth: v })}
                maxMonth={todayMonth}
              />
            )}

            {filter.period === 'range' && (
              <DateRangePicker
                start={filter.rangeStart}
                end={filter.rangeEnd}
                maxDate={todayStr}
                onChange={(s, e) => onChange({ rangeStart: s, rangeEnd: e })}
              />
            )}
          </section>

          {/* 게임 */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">게임</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onChange({ selectedGame: 'all' })}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                  filter.selectedGame === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                )}
              >
                전체
              </button>
              {games.map(g => (
                <button
                  key={g.id}
                  onClick={() => onChange({ selectedGame: g.id })}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                    filter.selectedGame === g.id ? 'text-white' : 'bg-gray-100 text-gray-600'
                  )}
                  style={filter.selectedGame === g.id ? { backgroundColor: g.color } : undefined}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Apply */}
        <div className="px-5 pt-2 pb-8">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-base active:opacity-80 transition-opacity"
          >
            적용하기
          </button>
        </div>
      </div>
    </>
  )
}
