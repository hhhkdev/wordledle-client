export const TILE_COLORS: Record<string, string> = {
  correct: 'bg-green-500 border-green-500 text-white',
  present: 'bg-yellow-400 border-yellow-400 text-white',
  absent:  'bg-gray-500  border-gray-500  text-white',
  tbd:     'bg-white border-gray-400 text-gray-900',
  empty:   'bg-white border-gray-200 text-gray-900',
}

export const KEY_COLORS: Record<string, string> = {
  correct: 'bg-green-500 text-white',
  present: 'bg-yellow-400 text-white',
  absent:  'bg-gray-400  text-white',
  unused:  'bg-gray-100  text-gray-900',
}

export const KEY_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]
