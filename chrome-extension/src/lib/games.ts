export interface GameInfo {
  slug: string
  name: string
  url: string
  color: string
}

export const GAMES: GameInfo[] = [
  { slug: 'wordledle',    name: '워들들',               url: 'https://wordledle-client.vercel.app/wordledle',   color: '#2563eb' },
  { slug: 'wordle',       name: 'Wordle',               url: 'https://www.nytimes.com/games/wordle/index.html', color: '#3D6B47' },
  { slug: 'kkodle',       name: '꼬들',                 url: 'https://kordle.kr',                               color: '#B8562A' },
  { slug: 'kkooooodle',   name: '꼬오오오오들',           url: 'https://koooo.kordle.kr',                         color: '#9B3535' },
  { slug: 'kkomanttle',   name: '꼬맨틀',               url: 'https://semantle-ko.newsjel.ly',                  color: '#5E3A96' },
  { slug: 'kakao-word',   name: '카카오 오늘의 단어',     url: '',                                                color: '#C49A00' },
  { slug: 'wordhurdle-4', name: 'Word Hurdle 4-letter', url: 'https://solitaired.com/wordhurdle-4-letter',      color: '#1e3a5f' },
  { slug: 'wordhurdle-5', name: 'Word Hurdle 5-letter', url: 'https://solitaired.com/wordhurdle-5-letter',      color: '#1a4f6e' },
  { slug: 'wordhurdle-6', name: 'Word Hurdle',          url: 'https://solitaired.com/wordhurdle',               color: '#163a52' },
]

export const GAME_BY_SLUG = Object.fromEntries(GAMES.map(g => [g.slug, g]))
