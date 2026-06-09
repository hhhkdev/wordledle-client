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
//
// 마스터 기준: 9개 게임 모두 평균 4번째에 성공 = 320점
//   Wordle/꼬들/꼬오오/WH×3: 30점씩, 꼬맨틀: 50, 카카오: 20, 워들들(4+4=8회, 2남음): 70
//   합계: 30×6 + 50 + 20 + 70 = 320
export const TIERS: Tier[] = [
  // Master
  { name: 'master',   label: '마스터',   sub: 0, color: '#7C3AED', textColor: '#fff', minAvg: 320 },
  // Ruby I→V  (265~319)
  { name: 'ruby',     label: '루비',     sub: 1, color: '#E84057', textColor: '#fff', minAvg: 310 },
  { name: 'ruby',     label: '루비',     sub: 2, color: '#E84057', textColor: '#fff', minAvg: 299 },
  { name: 'ruby',     label: '루비',     sub: 3, color: '#E84057', textColor: '#fff', minAvg: 288 },
  { name: 'ruby',     label: '루비',     sub: 4, color: '#E84057', textColor: '#fff', minAvg: 277 },
  { name: 'ruby',     label: '루비',     sub: 5, color: '#E84057', textColor: '#fff', minAvg: 265 },
  // Diamond I→V  (200~264)
  { name: 'diamond',  label: '다이아',   sub: 1, color: '#00B4FC', textColor: '#fff', minAvg: 252 },
  { name: 'diamond',  label: '다이아',   sub: 2, color: '#00B4FC', textColor: '#fff', minAvg: 239 },
  { name: 'diamond',  label: '다이아',   sub: 3, color: '#00B4FC', textColor: '#fff', minAvg: 226 },
  { name: 'diamond',  label: '다이아',   sub: 4, color: '#00B4FC', textColor: '#fff', minAvg: 213 },
  { name: 'diamond',  label: '다이아',   sub: 5, color: '#00B4FC', textColor: '#fff', minAvg: 200 },
  // Platinum I→V  (130~199)
  { name: 'platinum', label: '플래티넘', sub: 1, color: '#00C49A', textColor: '#fff', minAvg: 186 },
  { name: 'platinum', label: '플래티넘', sub: 2, color: '#00C49A', textColor: '#fff', minAvg: 172 },
  { name: 'platinum', label: '플래티넘', sub: 3, color: '#00C49A', textColor: '#fff', minAvg: 158 },
  { name: 'platinum', label: '플래티넘', sub: 4, color: '#00C49A', textColor: '#fff', minAvg: 144 },
  { name: 'platinum', label: '플래티넘', sub: 5, color: '#00C49A', textColor: '#fff', minAvg: 130 },
  // Gold I→V  (60~129)
  { name: 'gold',     label: '골드',     sub: 1, color: '#D4A017', textColor: '#fff', minAvg: 116 },
  { name: 'gold',     label: '골드',     sub: 2, color: '#D4A017', textColor: '#fff', minAvg: 102 },
  { name: 'gold',     label: '골드',     sub: 3, color: '#D4A017', textColor: '#fff', minAvg: 88  },
  { name: 'gold',     label: '골드',     sub: 4, color: '#D4A017', textColor: '#fff', minAvg: 74  },
  { name: 'gold',     label: '골드',     sub: 5, color: '#D4A017', textColor: '#fff', minAvg: 60  },
  // Silver I→V  (10~59)
  { name: 'silver',   label: '실버',     sub: 1, color: '#607D8B', textColor: '#fff', minAvg: 50  },
  { name: 'silver',   label: '실버',     sub: 2, color: '#607D8B', textColor: '#fff', minAvg: 40  },
  { name: 'silver',   label: '실버',     sub: 3, color: '#607D8B', textColor: '#fff', minAvg: 30  },
  { name: 'silver',   label: '실버',     sub: 4, color: '#607D8B', textColor: '#fff', minAvg: 20  },
  { name: 'silver',   label: '실버',     sub: 5, color: '#607D8B', textColor: '#fff', minAvg: 10  },
  // Bronze I→V  (<10)
  { name: 'bronze',   label: '브론즈',   sub: 1, color: '#AD6B2A', textColor: '#fff', minAvg: 0   },
  { name: 'bronze',   label: '브론즈',   sub: 2, color: '#AD6B2A', textColor: '#fff', minAvg: -10 },
  { name: 'bronze',   label: '브론즈',   sub: 3, color: '#AD6B2A', textColor: '#fff', minAvg: -20 },
  { name: 'bronze',   label: '브론즈',   sub: 4, color: '#AD6B2A', textColor: '#fff', minAvg: -30 },
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
