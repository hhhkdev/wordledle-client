import { cn } from '@/lib/utils'
import { evaluateGuess } from '@/lib/wordledle/words'
import { TILE_COLORS } from './constants'

export default function Board({ word, guesses, currentGuess, totalRows }: {
  word: string; guesses: string[]; currentGuess: string; totalRows: number
}) {
  const solved = guesses.some(g => g === word)
  const rows: { letters: string[]; state: string[] }[] = []

  guesses.forEach(g => rows.push({ letters: g.split(''), state: evaluateGuess(g, word) }))
  if (guesses.length < totalRows && !solved)
    rows.push({ letters: Array(5).fill('').map((_, i) => currentGuess[i] ?? ''), state: Array(5).fill('tbd') })
  while (rows.length < totalRows)
    rows.push({ letters: Array(5).fill(''), state: Array(5).fill('empty') })

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 justify-center">
          {row.letters.map((letter, ci) => {
            const state = ri < guesses.length ? row.state[ci] : (row.state[ci] === 'tbd' ? 'tbd' : 'empty')
            return (
              <div key={ci} className={cn(
                'w-12 h-12 border-2 flex items-center justify-center font-game',
                'text-lg font-black uppercase rounded-lg transition-colors duration-300',
                TILE_COLORS[state] ?? TILE_COLORS.empty,
              )}>{letter}</div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
