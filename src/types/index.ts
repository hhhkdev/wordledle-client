export interface User {
  id: string
  nickname: string
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
  created_at: string
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

export interface ParsedResult {
  score: number | null
  attempts: number | null
  max_attempts: number | null
  completed: boolean
}
