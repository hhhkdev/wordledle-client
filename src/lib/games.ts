import { Game, ParsedResult } from '@/types'

export const GAMES: Omit<Game, 'id' | 'created_at'>[] = [
  {
    name: 'Wordle',
    slug: 'wordle',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    description: '5글자 영단어 맞추기',
    emoji: '🟩',
    color: '#538d4e',
    result_format: 'Wordle 1,806 4/6',
  },
  {
    name: '꼬들',
    slug: 'kkodle',
    url: 'https://kordle.kr',
    description: '한국어 6글자 단어 맞추기',
    emoji: '🟧',
    color: '#e07c3a',
    result_format: '꼬들 1610 5/6 Kordle.Kr 🔥3',
  },
  {
    name: '꼬오오오오들',
    slug: 'kkooooodle',
    url: 'https://koooo.kordle.kr',
    description: '한국어 12글자 단어 맞추기',
    emoji: '🟥',
    color: '#c0392b',
    result_format: '꼬오오오오들 1310 5/6',
  },
  {
    name: '꼬맨틀',
    slug: 'kkomanttle',
    url: 'https://semantle-ko.newsjel.ly',
    description: '단어 유사도로 정답 찾기',
    emoji: '🧠',
    color: '#8e44ad',
    result_format: 'N번째 꼬맨틀을 풀었습니다!\n추측 횟수: N\n소요 시간: ...',
  },
]

// ── 점수 계산 헬퍼 ──────────────────────────────────────────

/**
 * 클리어 점수: 기본 점수 + 절약한 시도 수 (실패 시 0)
 * 절약한 시도 = max_attempts - attempts
 */
function scoreCleared(attempts: number | null, maxAttempts: number, basePoints: number): number {
  if (attempts === null) return 0
  return basePoints + (maxAttempts - attempts)
}

// ── 파서 ─────────────────────────────────────────────────────

export function parseGameResult(
  gameSlug: string,
  rawText: string
): ParsedResult | null {
  const text = rawText.trim()

  switch (gameSlug) {
    case 'wordle': {
      // "Wordle 1,806 4/6" or "Wordle 1,806 X/6"
      const match = text.match(/Wordle\s+[\d,]+\s+([X\d])\/6/i)
      if (!match) return null
      const attempts = match[1] === 'X' ? null : parseInt(match[1])
      const puzzleMatch = text.match(/Wordle\s+([\d,]+)/)
      return {
        score: scoreCleared(attempts, 6, 10),
        attempts,
        max_attempts: 6,
        completed: match[1] !== 'X',
        metadata: {
          puzzle_number: puzzleMatch ? parseInt(puzzleMatch[1].replace(/,/g, '')) : null,
        },
      }
    }

    case 'kkodle': {
      // "꼬들 1610 5/6 Kordle.Kr 🔥3"
      const match = text.match(/꼬들\s+(\d+)\s+([X\d])\/6/)
      if (!match) return null
      const attempts = match[2] === 'X' ? null : parseInt(match[2])
      const streakMatch = text.match(/🔥(\d+)/)
      return {
        score: scoreCleared(attempts, 6, 10),
        attempts,
        max_attempts: 6,
        completed: match[2] !== 'X',
        metadata: {
          puzzle_number: parseInt(match[1]),
          streak: streakMatch ? parseInt(streakMatch[1]) : null,
        },
      }
    }

    case 'kkooooodle': {
      // "꼬오오오오들 1310 5/6"
      const match = text.match(/꼬오오오오들\s+(\d+)\s+([X\d])\/6/)
      if (!match) return null
      const attempts = match[2] === 'X' ? null : parseInt(match[2])
      return {
        score: scoreCleared(attempts, 6, 20),
        attempts,
        max_attempts: 6,
        completed: match[2] !== 'X',
        metadata: {
          puzzle_number: parseInt(match[1]),
        },
      }
    }

    case 'kkomanttle': {
      // "N번째 꼬맨틀을 풀었습니다!\n추측 횟수: N\n소요 시간: HH시간MM분SS초\n최대 유사도: N.NN"
      const completed = text.includes('꼬맨틀을 풀었습니다')
      if (!completed && !text.includes('꼬맨틀')) return null

      const puzzleMatch = text.match(/(\d+)번째 꼬맨틀/)
      const attemptsMatch = text.match(/추측 횟수:\s*(\d+)/)
      const timeMatch = text.match(/소요 시간:\s*(\d+)시간(\d+)분(\d+)초/)
      const similarityMatch = text.match(/최대 유사도:\s*([\d.]+)/)

      const attempts = attemptsMatch ? parseInt(attemptsMatch[1]) : null
      const timeSeconds = timeMatch
        ? parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3])
        : null

      return {
        score: completed ? 20 : 0,
        attempts,
        max_attempts: null,
        completed,
        metadata: {
          puzzle_number: puzzleMatch ? parseInt(puzzleMatch[1]) : null,
          time_seconds: timeSeconds,
          max_similarity: similarityMatch ? parseFloat(similarityMatch[1]) : null,
        },
      }
    }

    default:
      return null
  }
}
