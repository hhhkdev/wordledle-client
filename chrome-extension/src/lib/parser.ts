// 게임 결과 파서 — src/lib/games.ts와 로직을 동기화해야 합니다

export type ParsedResult = {
  score: number
  attempts: number | null
  max_attempts: number | null
  completed: boolean
  metadata: Record<string, unknown>
}

export const GAME_NAMES: Record<string, string> = {
  'wordle':       'Wordle',
  'kkodle':       '꼬들',
  'kkooooodle':   '꼬오오오오들',
  'kkomanttle':   '꼬맨틀',
  'kakao-word':   '카카오 오늘의 단어',
  'wordhurdle-4': 'Word Hurdle 4-letter',
  'wordhurdle-5': 'Word Hurdle 5-letter',
  'wordhurdle-6': 'Word Hurdle',
}

function scoreCleared(attempts: number | null, maxAttempts: number, basePoints: number): number {
  if (attempts === null) return -Math.floor(basePoints / 2)
  return basePoints + (maxAttempts - attempts)
}

export function parseGameResult(slug: string, rawText: string): ParsedResult | null {
  const text = rawText.trim()

  switch (slug) {
    case 'wordle': {
      const m = text.match(/Wordle\s+[\d,]+\s+([X\d])\/6/i)
      if (!m) return null
      const attempts = m[1] === 'X' ? null : parseInt(m[1])
      const pn = text.match(/Wordle\s+([\d,]+)/)
      return {
        score: scoreCleared(attempts, 6, 10),
        attempts, max_attempts: 6, completed: m[1] !== 'X',
        metadata: { puzzle_number: pn ? parseInt(pn[1].replace(/,/g, '')) : null },
      }
    }
    case 'kkodle': {
      const m = text.match(/꼬들\s+(\d+)\s+([X\d])\/6/)
      if (!m) return null
      const attempts = m[2] === 'X' ? null : parseInt(m[2])
      const streak = text.match(/🔥(\d+)/)
      return {
        score: scoreCleared(attempts, 6, 10),
        attempts, max_attempts: 6, completed: m[2] !== 'X',
        metadata: { puzzle_number: parseInt(m[1]), streak: streak ? parseInt(streak[1]) : null },
      }
    }
    case 'kkooooodle': {
      const m = text.match(/꼬오오오오들\s+(\d+)\s+([X\d])\/6/)
      if (!m) return null
      const attempts = m[2] === 'X' ? null : parseInt(m[2])
      return {
        score: scoreCleared(attempts, 6, 20),
        attempts, max_attempts: 6, completed: m[2] !== 'X',
        metadata: { puzzle_number: parseInt(m[1]) },
      }
    }
    case 'kkomanttle': {
      const completed = text.includes('꼬맨틀을 풀었습니다')
      if (!completed && !text.includes('꼬맨틀')) return null
      const pn = text.match(/(\d+)번째 꼬맨틀/)
      const att = text.match(/추측 횟수:\s*(\d+)/)
      const tm = text.match(/소요 시간:\s*(\d+)시간(\d+)분(\d+)초/)
      const sim = text.match(/최대 유사도:\s*([\d.]+)/)
      const attempts = att ? parseInt(att[1]) : null
      const time_seconds = tm
        ? parseInt(tm[1]) * 3600 + parseInt(tm[2]) * 60 + parseInt(tm[3])
        : null
      return {
        score: completed ? 20 : 0,
        attempts, max_attempts: null, completed,
        metadata: {
          puzzle_number: pn ? parseInt(pn[1]) : null,
          time_seconds,
          max_similarity: sim ? parseFloat(sim[1]) : null,
        },
      }
    }
    case 'kakao-word': {
      const isA = text.includes('오늘의 단어') || text.toLowerCase().includes("today's word")
      const earlyM = text.match(/(\d+)번째\s*정답자입니다/)
      if (!isA && !earlyM) return null
      const completed = earlyM ? true : text.includes('성공') || text.toLowerCase().includes('success')
      const emojiRows = text.split('\n').filter(l => /^[⬛🟨🟩🟫]+$/.test(l.trim()))
      const attempts = emojiRows.length > 0 ? emojiRows.length : null
      return {
        score: scoreCleared(attempts, 5, 10) + (earlyM ? 5 : 0),
        attempts, max_attempts: 5, completed,
        metadata: { puzzle_number: null, early_solver_rank: earlyM ? parseInt(earlyM[1]) : null },
      }
    }
    case 'wordhurdle-6': {
      const m = text.match(/Word\s+Hurdle\s+(\d+)\s+(\d+)\/(\d+)/i)
      if (!m) return null
      const attempts = parseInt(m[2])
      const maxAttempts = parseInt(m[3])
      const completed = attempts <= maxAttempts
      return {
        score: completed ? scoreCleared(attempts, maxAttempts, 10) : -5,
        attempts, max_attempts: maxAttempts, completed,
        metadata: { puzzle_number: parseInt(m[1]) },
      }
    }
    case 'wordhurdle-4':
    case 'wordhurdle-5': {
      const m = text.match(/Word\s+Hurdle\s+\d+-letter\s+(\d+)\s+(\d+)\/(\d+)/i)
      if (!m) return null
      const attempts = parseInt(m[2])
      const maxAttempts = parseInt(m[3])
      const completed = attempts <= maxAttempts
      return {
        score: completed ? scoreCleared(attempts, maxAttempts, 10) : -5,
        attempts, max_attempts: maxAttempts, completed,
        metadata: { puzzle_number: parseInt(m[1]) },
      }
    }
    default:
      return null
  }
}
