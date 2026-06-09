'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortKey = 'completed' | 'score' | 'tier'

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'tier',      label: '티어순' },
  { key: 'score',     label: '점수순' },
  { key: 'completed', label: '완료순' },
]

interface SortDropdownProps {
  value: SortKey
  onChange: (v: SortKey) => void
  disabled?: boolean
}

export default function SortDropdown({ value, onChange, disabled }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const label = disabled ? '추측순' : OPTIONS.find(o => o.key === value)?.label ?? value

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors active:opacity-70',
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : open
            ? 'bg-gray-200 text-gray-900'
            : 'bg-gray-100 text-gray-700'
        )}
      >
        <ArrowUpDown size={14} />
        {label}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 w-28">
          {OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false) }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors',
                value === key
                  ? 'bg-gray-50 font-bold text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 font-semibold'
              )}
            >
              {label}
              {value === key && <Check size={13} className="text-blue-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
