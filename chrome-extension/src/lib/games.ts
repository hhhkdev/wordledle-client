export interface GameInfo {
  slug: string
  name: string
  shortName: string
  url: string
  emoji: string
  color: string
}

export const GAMES: GameInfo[] = [
  { slug: 'wordledle',    name: '워들들',              shortName: '워들들',    url: 'https://wordledle-client.vercel.app/wordledle',   emoji: '🎮', color: '#2563eb' },
  { slug: 'wordle',       name: 'Wordle',             shortName: 'Wordle',    url: 'https://www.nytimes.com/games/wordle/index.html', emoji: '🟩', color: '#3D6B47' },
  { slug: 'kkodle',       name: '꼬들',               shortName: '꼬들',      url: 'https://kordle.kr',                               emoji: '🟧', color: '#B8562A' },
  { slug: 'kkooooodle',   name: '꼬오오오오들',        shortName: '꼬오오들',   url: 'https://koooo.kordle.kr',                         emoji: '🟥', color: '#9B3535' },
  { slug: 'kkomanttle',   name: '꼬맨틀',             shortName: '꼬맨틀',     url: 'https://semantle-ko.newsjel.ly',                  emoji: '🧠', color: '#5E3A96' },
  { slug: 'kakao-word',   name: '카카오 오늘의 단어',  shortName: '카카오',     url: '',                                                emoji: '💬', color: '#C49A00' },
  { slug: 'wordhurdle-4', name: 'Word Hurdle 4',      shortName: 'WH 4글자',  url: 'https://solitaired.com/wordhurdle-4-letter',      emoji: '💙', color: '#1e3a5f' },
  { slug: 'wordhurdle-5', name: 'Word Hurdle 5',      shortName: 'WH 5글자',  url: 'https://solitaired.com/wordhurdle-5-letter',      emoji: '💙', color: '#1a4f6e' },
  { slug: 'wordhurdle-6', name: 'Word Hurdle',        shortName: 'WH 6글자',  url: 'https://solitaired.com/wordhurdle',               emoji: '💙', color: '#163a52' },
]

export const GAME_BY_SLUG = Object.fromEntries(GAMES.map(g => [g.slug, g]))
