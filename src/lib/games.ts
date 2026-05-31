import { Game, ParsedResult } from '@/types'

export const GAMES: Omit<Game, 'id' | 'created_at'>[] = [
  {
    name: 'Wordle',
    slug: 'wordle',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    description: '5글자 영단어 맞추기',
    emoji: '🟩',
    color: '#6aaa64',
    result_format: 'Wordle {number} {attempts}/6',
  },
  {
    name: '꼬들',
    slug: 'kkodle',
    url: 'https://kkodle.com',
    description: '한국어 5글자 단어 맞추기',
    emoji: '🟧',
    color: '#e77e2d',
    result_format: '꼬들 {number} {attempts}/6',
  },
  {
    name: 'Connections',
    slug: 'connections',
    url: 'https://www.nytimes.com/games/connections',
    description: '4가지 카테고리로 단어 묶기',
    emoji: '🟨',
    color: '#f9c74f',
    result_format: 'Connections\nPuzzle #{number}',
  },
  {
    name: 'Mini Crossword',
    slug: 'mini-crossword',
    url: 'https://www.nytimes.com/crosswords/game/mini',
    description: '5x5 미니 십자말풀이',
    emoji: '✏️',
    color: '#4a90d9',
    result_format: 'NYT Mini Crossword',
  },
  {
    name: 'Quordle',
    slug: 'quordle',
    url: 'https://www.merriam-webster.com/games/quordle',
    description: '4개 단어 동시에 맞추기',
    emoji: '🟦',
    color: '#3b82f6',
    result_format: 'Daily Quordle {number}',
  },
  {
    name: 'Framed',
    slug: 'framed',
    url: 'https://framed.wtf',
    description: '영화 스틸컷으로 영화 맞추기',
    emoji: '🎬',
    color: '#6366f1',
    result_format: 'Framed #{number}',
  },
]

export function parseGameResult(gameSlug: string, rawText: string): ParsedResult | null {
  const text = rawText.trim()

  switch (gameSlug) {
    case 'wordle': {
      // "Wordle 1,234 3/6" or "Wordle 1,234 X/6"
      const match = text.match(/Wordle\s+[\d,]+\s+([X\d])\/6/i)
      if (!match) return null
      const attempts = match[1] === 'X' ? null : parseInt(match[1])
      return {
        score: attempts ? 7 - attempts : 0,
        attempts,
        max_attempts: 6,
        completed: match[1] !== 'X',
      }
    }

    case 'kkodle': {
      // "꼬들 #123 3/6" or "꼬들 #123 X/6"
      const match = text.match(/꼬들\s+#?\d+\s+([X\d])\/6/i)
      if (!match) return null
      const attempts = match[1] === 'X' ? null : parseInt(match[1])
      return {
        score: attempts ? 7 - attempts : 0,
        attempts,
        max_attempts: 6,
        completed: match[1] !== 'X',
      }
    }

    case 'connections': {
      // Connections result with colored squares
      const hasResult = text.includes('Connections') && text.includes('Puzzle #')
      if (!hasResult) return null
      const completed = !text.includes('🟥🟥🟥🟥') || text.split('\n').filter(l => l.includes('🟩🟩🟩🟩') || l.includes('🟨🟨🟨🟨') || l.includes('🟦🟦🟦🟦') || l.includes('🟪🟪🟪🟪')).length === 4
      const lines = text.split('\n').filter(l => l.match(/[🟥🟨🟩🟦🟪]/u))
      return {
        score: completed ? Math.max(0, 5 - lines.length) : 0,
        attempts: lines.length,
        max_attempts: null,
        completed,
      }
    }

    case 'quordle': {
      // "Daily Quordle 123\n🟩🟩..."
      const match = text.match(/Daily Quordle\s+\d+/)
      if (!match) return null
      const numLines = text.split('\n').filter(l => l.match(/[🟩🟨⬛🟦]/u)).length
      return {
        score: numLines > 0 ? Math.max(0, 10 - Math.floor(numLines / 2)) : 0,
        attempts: numLines,
        max_attempts: null,
        completed: numLines > 0,
      }
    }

    case 'framed': {
      // "Framed #123\n🎬🔴🔴..."
      const match = text.match(/Framed\s+#\d+/)
      if (!match) return null
      const greenCount = (text.match(/🟩/gu) || []).length
      const completed = greenCount > 0
      const attempts = text.split('\n').filter(l => l.match(/[🔴🟩]/u)).length || null
      return {
        score: completed ? (attempts ? 7 - attempts : 1) : 0,
        attempts: attempts,
        max_attempts: 6,
        completed,
      }
    }

    default:
      return null
  }
}
