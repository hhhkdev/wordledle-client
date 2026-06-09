import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { evaluateGuess } from '@/lib/wordledle/words'

const MAX_GUESSES = 10
const SITE_URL = 'https://wordledle-client.vercel.app/'

function calcScore(
  word1Guesses: string[], word2Guesses: string[],
  words: [string, string], won: boolean,
): number {
  const solved1 = word1Guesses.some(g => g === words[0])
  const solved2 = word2Guesses.some(g => g === words[1])
  const wordScore = (solved1 ? 30 : 0) + (solved2 ? 30 : 0)
  const remaining = MAX_GUESSES - word1Guesses.length - word2Guesses.length
  const bonus = won ? remaining * 5 : 0
  let penalty = 0
  if (!won) {
    if (!solved1) penalty -= 15
    if (!solved2 && word2Guesses.length > 0) penalty -= 15
  }
  return wordScore + bonus + penalty
}

export { calcScore }

export default function GameResultModal({ won, words, word1Guesses, word2Guesses, onClose }: {
  won: boolean; words: [string, string]
  word1Guesses: string[]; word2Guesses: string[]; onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const solved1 = word1Guesses.some(g => g === words[0])
  const solved2 = word2Guesses.some(g => g === words[1])
  const score = calcScore(word1Guesses, word2Guesses, words, won)
  const total = word1Guesses.length + word2Guesses.length

  function buildShareText() {
    const date = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    const result = won ? `🎉 성공 (${total}/${MAX_GUESSES}회 · ${score}점)` : `💀 실패`
    const board = (guesses: string[], word: string) =>
      guesses.map(g => evaluateGuess(g, word).map(s =>
        s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')).join('\n')
    return `워들들 ${date}\n${result}\n\n단어 1\n${board(word1Guesses, words[0])}\n\n단어 2\n${board(word2Guesses, words[1])}\n\n${SITE_URL}`
  }

  function handleShare() {
    navigator.clipboard.writeText(buildShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>

        <div className="text-center mb-5">
          {won ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-xl font-black text-gray-900">성공!</p>
              <p className="text-sm text-gray-500 mt-1">{total}번 사용</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-1.5">
                <span className="text-yellow-600 text-sm font-black">{score}점</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">💀</div>
              <p className="text-xl font-black text-gray-900">아쉬워요</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-4 py-1.5">
                <span className="text-red-500 text-sm font-black">{score}점</span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mb-5">
          {words.map((word, i) => {
            const isSolved = i === 0 ? solved1 : solved2
            const cnt = i === 0 ? word1Guesses.length : word2Guesses.length
            return (
              <div key={i} className={cn(
                'flex-1 rounded-xl p-3 text-center',
                isSolved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
              )}>
                <p className="text-xs font-bold text-gray-500 mb-1">단어 {i + 1}</p>
                <p className={cn('text-base font-black uppercase tracking-widest font-game',
                  isSolved ? 'text-green-700' : 'text-red-500')}>{word}</p>
                {isSolved && <p className="text-xs text-green-600 mt-0.5">{cnt}번</p>}
              </div>
            )
          })}
        </div>

        <button onClick={handleShare}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black active:opacity-80 transition-opacity">
          {copied ? '✓ 복사됨!' : '결과 공유'}
        </button>
      </div>
    </div>
  )
}
