import { GameResult, Game } from '@/types'

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
}

type R = GameResult & { game?: Game }

function kstDates(results: R[]): string[] {
  return [...new Set(results.map(r => r.date))].sort()
}

function maxStreak(sortedDates: string[]): number {
  if (!sortedDates.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00')
    const curr = new Date(sortedDates[i] + 'T00:00:00')
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    cur = diff === 1 ? cur + 1 : 1
    if (cur > best) best = cur
  }
  return best
}

export function computeAchievements(results: R[], totalGameCount: number): Achievement[] {
  const byDate = new Map<string, R[]>()
  for (const r of results) {
    if (!byDate.has(r.date)) byDate.set(r.date, [])
    byDate.get(r.date)!.push(r)
  }

  const completedResults = results.filter(r => r.completed)
  const activeDates = [...new Set(completedResults.map(r => r.date))].sort()
  const streak = maxStreak(activeDates)
  const uniqueGameSlugs = new Set(results.map(r => r.game?.slug).filter(Boolean))

  const hasAllClear = [...byDate.values()].some(
    rs => rs.filter(r => r.completed).length >= totalGameCount && totalGameCount > 0
  )

  const maxDailyScore = [...byDate.values()].reduce((best, rs) => {
    const sum = rs.reduce((s, r) => s + (r.score ?? 0), 0)
    return Math.max(best, sum)
  }, 0)

  const kkomanttle = completedResults.find(r => r.game?.slug === 'kkomanttle')
  const kkoAttempts = kkomanttle?.attempts ?? Infinity

  const hasSpeedClear = completedResults.some(r => r.attempts === 1)

  return [
    {
      id: 'first_clear',
      name: '첫 발걸음',
      desc: '게임을 처음으로 클리어했어요',
      icon: '🎯',
      unlocked: completedResults.length > 0,
    },
    {
      id: 'all_games',
      name: '게임 전도사',
      desc: '모든 게임을 한 번씩 플레이했어요',
      icon: '🎮',
      unlocked: uniqueGameSlugs.size >= totalGameCount && totalGameCount > 0,
    },
    {
      id: 'all_clear',
      name: '올클리어',
      desc: '하루에 모든 게임을 클리어했어요',
      icon: '🏆',
      unlocked: hasAllClear,
    },
    {
      id: 'streak_7',
      name: '7일 연속',
      desc: '7일 연속으로 게임을 클리어했어요',
      icon: '🔥',
      unlocked: streak >= 7,
    },
    {
      id: 'streak_30',
      name: '한 달 연속',
      desc: '30일 연속으로 게임을 클리어했어요',
      icon: '🌙',
      unlocked: streak >= 30,
    },
    {
      id: 'veteran',
      name: '베테랑',
      desc: '30일 이상 활동했어요',
      icon: '⭐',
      unlocked: activeDates.length >= 30,
    },
    {
      id: 'century',
      name: '100일 클럽',
      desc: '100일 이상 활동했어요',
      icon: '💎',
      unlocked: activeDates.length >= 100,
    },
    {
      id: 'speed_clear',
      name: '번개 클리어',
      desc: '1번 만에 게임을 맞혔어요',
      icon: '⚡',
      unlocked: hasSpeedClear,
    },
    {
      id: 'kkomanttle_master',
      name: '꼬맨틀 마스터',
      desc: '꼬맨틀을 30번 이내로 풀었어요',
      icon: '🧠',
      unlocked: kkoAttempts <= 30,
    },
    {
      id: 'high_score',
      name: '하이스코어',
      desc: '하루 60점 이상을 달성했어요',
      icon: '🌟',
      unlocked: maxDailyScore >= 60,
    },
  ]
}
