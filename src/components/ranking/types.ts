import { GameResult, User } from '@/types'

export interface RankingEntry {
  user: User
  results: GameResult[]
  totalScore: number
  completedCount: number
  primaryStat: number | null
  avgDailyScore: number
  activeDays: number
}
