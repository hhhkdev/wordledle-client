export interface User {
  id: string
  nickname: string
  is_admin: boolean
  created_at: string
}

export interface Game {
  id: string
  name: string
  slug: string
  url: string
  description: string
  emoji: string
  color: string
  result_format: string
  /** 카드 배경 이미지 URL. 권장: 800×600px (4:3). 안전 영역: 상단 40% */
  image_url?: string | null
  created_at: string
}

export interface GameResultMetadata {
  puzzle_number?: number | null
  streak?: number | null
  time_seconds?: number | null
  max_similarity?: number | null
}

export interface GameResult {
  id: string
  user_id: string
  game_id: string
  date: string
  raw_result: string
  score: number | null
  attempts: number | null
  max_attempts: number | null
  completed: boolean
  puzzle_number: number | null
  metadata: GameResultMetadata | null
  created_at: string
  user?: User
  game?: Game
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  created_at: string
  friend?: User
}

export interface Feedback {
  id: string
  user_id: string | null
  content: string
  created_at: string
  user?: Pick<User, 'id' | 'nickname'>
}

export interface ParsedResult {
  score: number | null
  attempts: number | null
  max_attempts: number | null
  completed: boolean
  metadata?: GameResultMetadata
}
