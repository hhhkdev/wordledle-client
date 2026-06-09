import { cn } from '@/lib/utils'
import { KEY_COLORS, KEY_ROWS } from './constants'

export default function Keyboard({ keyStates, onKey }: {
  keyStates: Record<string, 'correct' | 'present' | 'absent' | 'unused'>
  onKey: (k: string) => void
}) {
  return (
    <div className="flex flex-col gap-0.75 w-full select-none">
      {KEY_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-0.75 w-full">
          {row.map(key => {
            const isAction = key === 'ENTER' || key === '⌫'
            return (
              <button key={key}
                onPointerDown={e => { e.preventDefault(); onKey(key) }}
                className={cn(
                  'h-14 rounded-lg flex items-center justify-center',
                  'transition-colors active:opacity-60',
                  isAction
                    ? 'flex-[1.5] text-[11px] font-black tracking-tight bg-gray-300 text-gray-800'
                    : 'flex-1 font-bold text-sm font-game',
                  !isAction && KEY_COLORS[keyStates[key] ?? 'unused'],
                )}
              >{key}</button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
