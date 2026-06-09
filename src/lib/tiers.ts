export type TierName =
  | 'unrated' | 'bronze' | 'silver' | 'gold'
  | 'platinum' | 'diamond' | 'ruby' | 'master'

export interface Tier {
  name: TierName
  label: string
  sub: number       // 1=I(최고) ~ 5=V(최저), 0=없음(언레이티드·마스터)
  color: string     // 뱃지 배경색
  textColor: string
  minAvg: number    // 이 티어에 도달하는 최소 일평균 점수
}

// 내림차순 정렬 — computeTier()가 위에서부터 조건 탐색
export const TIERS: Tier[] = [
  // Master
  { name: 'master',   label: '마스터',   sub: 0, color: '#7C3AED', textColor: '#fff', minAvg: 160 },
  // Ruby I→V
  { name: 'ruby',     label: '루비',     sub: 1, color: '#E84057', textColor: '#fff', minAvg: 155 },
  { name: 'ruby',     label: '루비',     sub: 2, color: '#E84057', textColor: '#fff', minAvg: 150 },
  { name: 'ruby',     label: '루비',     sub: 3, color: '#E84057', textColor: '#fff', minAvg: 145 },
  { name: 'ruby',     label: '루비',     sub: 4, color: '#E84057', textColor: '#fff', minAvg: 140 },
  { name: 'ruby',     label: '루비',     sub: 5, color: '#E84057', textColor: '#fff', minAvg: 135 },
  // Diamond I→V
  { name: 'diamond',  label: '다이아',   sub: 1, color: '#00B4FC', textColor: '#fff', minAvg: 130 },
  { name: 'diamond',  label: '다이아',   sub: 2, color: '#00B4FC', textColor: '#fff', minAvg: 126 },
  { name: 'diamond',  label: '다이아',   sub: 3, color: '#00B4FC', textColor: '#fff', minAvg: 122 },
  { name: 'diamond',  label: '다이아',   sub: 4, color: '#00B4FC', textColor: '#fff', minAvg: 118 },
  { name: 'diamond',  label: '다이아',   sub: 5, color: '#00B4FC', textColor: '#fff', minAvg: 114 },
  // Platinum I→V
  { name: 'platinum', label: '플래티넘', sub: 1, color: '#00C49A', textColor: '#fff', minAvg: 110 },
  { name: 'platinum', label: '플래티넘', sub: 2, color: '#00C49A', textColor: '#fff', minAvg: 105 },
  { name: 'platinum', label: '플래티넘', sub: 3, color: '#00C49A', textColor: '#fff', minAvg: 100 },
  { name: 'platinum', label: '플래티넘', sub: 4, color: '#00C49A', textColor: '#fff', minAvg: 95  },
  { name: 'platinum', label: '플래티넘', sub: 5, color: '#00C49A', textColor: '#fff', minAvg: 90  },
  // Gold I→V
  { name: 'gold',     label: '골드',     sub: 1, color: '#D4A017', textColor: '#fff', minAvg: 80  },
  { name: 'gold',     label: '골드',     sub: 2, color: '#D4A017', textColor: '#fff', minAvg: 70  },
  { name: 'gold',     label: '골드',     sub: 3, color: '#D4A017', textColor: '#fff', minAvg: 60  },
  { name: 'gold',     label: '골드',     sub: 4, color: '#D4A017', textColor: '#fff', minAvg: 50  },
  { name: 'gold',     label: '골드',     sub: 5, color: '#D4A017', textColor: '#fff', minAvg: 40  },
  // Silver I→V
  { name: 'silver',   label: '실버',     sub: 1, color: '#607D8B', textColor: '#fff', minAvg: 30  },
  { name: 'silver',   label: '실버',     sub: 2, color: '#607D8B', textColor: '#fff', minAvg: 24  },
  { name: 'silver',   label: '실버',     sub: 3, color: '#607D8B', textColor: '#fff', minAvg: 18  },
  { name: 'silver',   label: '실버',     sub: 4, color: '#607D8B', textColor: '#fff', minAvg: 12  },
  { name: 'silver',   label: '실버',     sub: 5, color: '#607D8B', textColor: '#fff', minAvg: 6   },
  // Bronze I→V
  { name: 'bronze',   label: '브론즈',   sub: 1, color: '#AD6B2A', textColor: '#fff', minAvg: 0   },
  { name: 'bronze',   label: '브론즈',   sub: 2, color: '#AD6B2A', textColor: '#fff', minAvg: -5  },
  { name: 'bronze',   label: '브론즈',   sub: 3, color: '#AD6B2A', textColor: '#fff', minAvg: -10 },
  { name: 'bronze',   label: '브론즈',   sub: 4, color: '#AD6B2A', textColor: '#fff', minAvg: -15 },
  { name: 'bronze',   label: '브론즈',   sub: 5, color: '#AD6B2A', textColor: '#fff', minAvg: -Infinity },
]

export const UNRATED: Tier = {
  name: 'unrated', label: '언레이티드', sub: 0,
  color: '#e5e7eb', textColor: '#9ca3af', minAvg: -Infinity,
}

const SUB_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'] as const

export function getTierLabel(tier: Tier): string {
  return tier.sub === 0 ? tier.label : `${tier.label} ${SUB_ROMAN[tier.sub]}`
}

/** 일평균 점수 + 활동 일수 → 티어 */
export function computeTier(avgDailyScore: number, activeDays: number): Tier {
  if (activeDays < 7) return UNRATED
  return TIERS.find(t => avgDailyScore >= t.minAvg) ?? TIERS[TIERS.length - 1]
}

/** results 배열 → 티어 (날짜별 합산 후 평균) */
export function computeUserTier(results: { date: string; score: number }[]): Tier {
  if (results.length === 0) return UNRATED

  const byDate: Record<string, number> = {}
  for (const r of results) {
    byDate[r.date] = (byDate[r.date] ?? 0) + (r.score ?? 0)
  }
  const daily = Object.values(byDate)
  const avg = daily.reduce((a, b) => a + b, 0) / daily.length

  return computeTier(avg, daily.length)
}
