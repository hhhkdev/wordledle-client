import { Game, ParsedResult } from '@/types'

export function getGameImageUrl(slug: string, override?: string | null): string {
  // override에 이미 쿼리 파라미터가 있으면 그대로 사용 (관리자가 ?v=2 등으로 수동 버스팅 가능)
  if (override) return override
  // 자동 생성 URL에는 날짜를 캐시버스터로 추가
  // — 같은 파일명으로 이미지를 교체했을 때 CDN(Cloudflare) 캐시를 우회
  // — 날짜 단위로 바뀌므로 과도한 재요청 없이 최신 이미지를 하루 내에 반영
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/game-images/${slug}.jpg?v=${date}`
}

export const GAMES: Omit<Game, 'id' | 'created_at'>[] = [
  {
    name: 'Wordle',
    slug: 'wordle',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    description: '5글자 영단어 맞추기',
    emoji: '🟩',
    color: '#3D6B47',
    result_format: 'Wordle 1,806 4/6',
  },
  {
    name: '꼬들',
    slug: 'kkodle',
    url: 'https://kordle.kr',
    description: '한국어 6글자 단어 맞추기',
    emoji: '🟧',
    color: '#B8562A',
    result_format: '꼬들 1610 5/6 Kordle.Kr 🔥3',
  },
  {
    name: '꼬오오오오들',
    slug: 'kkooooodle',
    url: 'https://koooo.kordle.kr',
    description: '한국어 12글자 단어 맞추기',
    emoji: '🟥',
    color: '#9B3535',
    result_format: '꼬오오오오들 1310 5/6',
  },
  {
    name: '꼬맨틀',
    slug: 'kkomanttle',
    url: 'https://semantle-ko.newsjel.ly',
    description: '단어 유사도로 정답 찾기',
    emoji: '🧠',
    color: '#5E3A96',
    result_format: 'N번째 꼬맨틀을 풀었습니다!\n추측 횟수: N\n소요 시간: ...',
  },
  {
    name: '카카오 오늘의 단어',
    slug: 'kakao-word',
    url: '',
    description: '카카오톡 미니게임 — 결과 입력 전용',
    emoji: '💬',
    color: '#C49A00',
    result_format: '오늘의 단어 맞히기 성공!\n\n⬛🟨⬛⬛⬛\n🟩🟩🟩🟩🟩\n또는\n2026년 6월 5일\n🎉 425번째 정답자입니다!\n\n🟫🟫🟫🟫🟫\n🟩🟩🟩🟩🟩',
  },
  {
    name: 'Word Hurdle 4-letter',
    slug: 'wordhurdle-4',
    url: 'https://solitaired.com/wordhurdle-4-letter',
    description: '4글자 영단어 맞추기',
    emoji: '💙',
    color: '#1e3a5f',
    result_format: 'Word Hurdle 4-letter 3201 4/6 #wordhurdle\n🤍🤍🤍💛\n💙🤍🤍🤍\n💙💙💙💙',
  },
  {
    name: 'Word Hurdle 5-letter',
    slug: 'wordhurdle-5',
    url: 'https://solitaired.com/wordhurdle-5-letter',
    description: '5글자 영단어 맞추기',
    emoji: '💙',
    color: '#1e3a5f',
    result_format: 'Word Hurdle 5-letter 3201 3/6 #wordhurdle\n💙🤍🤍🤍🤍\n🤍💙💙💙💙\n💙💙💙💙💙',
  },
  {
    name: 'Word Hurdle',
    slug: 'wordhurdle-6',
    url: 'https://solitaired.com/wordhurdle',
    description: '6글자 영단어 맞추기',
    emoji: '💙',
    color: '#1e3a5f',
    result_format: 'Word Hurdle 3201 5/6 #wordhurdle\n💛💛💛🤍🤍🤍\n💙💙💙💙💙💙',
  },
]

/**
 * 게임별 현재 회차 시작 날짜 (YYYY-MM-DD)
 * - wordle: 미국 동부 자정 기준 (America/New_York)
 * - 나머지: 한국 자정 기준 (Asia/Seoul)
 */
export function getGameCurrentPeriodStart(_slug: string): string {
  // 결과 저장 시 항상 KST 날짜를 사용하므로, 기간 시작점도 KST로 통일
  // Wordle은 뉴욕 자정(KST 13~14시)에 초기화되지만, 결과 date는 KST 기준으로 저장됨
  // 뉴욕 시간대를 쓰면 자정~13시 사이에 어제 결과가 오늘 완료로 잘못 표시되는 버그 발생
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

// ── 점수 계산 헬퍼 ──────────────────────────────────────────

/**
 * 클리어 점수: 기본 점수 + 절약한 시도 수
 * 실패(attempts === null, 즉 X/N) 시 기본 점수의 절반을 페널티로 적용
 */
function scoreCleared(attempts: number | null, maxAttempts: number, basePoints: number): number {
  if (attempts === null) return -Math.floor(basePoints / 2)
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

    case 'kakao-word': {
      // 포맷 A: "오늘의 단어 맞히기 성공!" (기존)
      // 포맷 B: "N번째 정답자입니다!" (빠른 풀이 보너스 +5점)
      const isFormatA = text.includes('오늘의 단어') || text.toLowerCase().includes("today's word")
      const earlyMatch = text.match(/(\d+)번째\s*정답자입니다/)
      const isFormatB = !!earlyMatch
      if (!isFormatA && !isFormatB) return null

      const completed = isFormatB
        ? true
        : text.includes('성공') || text.toLowerCase().includes('success')

      // 이모지 행(⬛🟨🟩🟫로만 구성된 줄) 개수로 시도 횟수 산출
      const emojiRowPattern = /^[⬛🟨🟩🟫]+$/
      const emojiRows = text.split('\n').filter(l => emojiRowPattern.test(l.trim()))
      const attempts = emojiRows.length > 0 ? emojiRows.length : null

      const bonus = isFormatB ? 5 : 0
      return {
        score: scoreCleared(attempts, 6, 10) + bonus,
        attempts,
        max_attempts: 6,
        completed,
        metadata: {
          puzzle_number: null,
          early_solver_rank: earlyMatch ? parseInt(earlyMatch[1]) : null,
        },
      }
    }

    case 'wordhurdle-6': {
      // "Word Hurdle 3201 5/6 #wordhurdle" (6-letter, no size prefix)
      const wh6Match = text.match(/Word\s+Hurdle\s+(\d+)\s+(\d+)\/(\d+)/i)
      if (!wh6Match) return null
      const puzzleNumber = parseInt(wh6Match[1])
      const attempts = parseInt(wh6Match[2])
      const maxAttempts = parseInt(wh6Match[3])
      const completed = attempts <= maxAttempts
      return {
        score: completed ? scoreCleared(attempts, maxAttempts, 10) : -5,
        attempts,
        max_attempts: maxAttempts,
        completed,
        metadata: { puzzle_number: puzzleNumber },
      }
    }

    case 'wordhurdle-4':
    case 'wordhurdle-5': {
      // "Word Hurdle 4-letter 3201 4/6 #wordhurdle"
      const whMatch = text.match(/Word\s+Hurdle\s+\d+-letter\s+(\d+)\s+(\d+)\/(\d+)/i)
      if (!whMatch) return null
      const puzzleNumber = parseInt(whMatch[1])
      const attempts = parseInt(whMatch[2])
      const maxAttempts = parseInt(whMatch[3])
      const completed = attempts <= maxAttempts

      return {
        score: completed ? scoreCleared(attempts, maxAttempts, 10) : -5,
        attempts,
        max_attempts: maxAttempts,
        completed,
        metadata: { puzzle_number: puzzleNumber },
      }
    }

    // 워들들은 게임 페이지에서 결과를 자동 저장 — 수동 입력 불필요
    case 'wordledle':
      return null

    default:
      return null
  }
}
