// 게임 사이트에서 복사 이벤트를 감지해 background로 전달

const SLUG_MAP: Record<string, string> = {
  'www.nytimes.com': 'wordle',
  'kordle.kr':       'kkodle',
  'koooo.kordle.kr': 'kkooooodle',
  'semantle-ko.newsjel.ly': 'kkomanttle',
}

function getSlug(): string | null {
  const host = location.hostname
  if (host in SLUG_MAP) return SLUG_MAP[host]
  if (host === 'solitaired.com') {
    const p = location.pathname
    if (p.includes('wordhurdle-4-letter')) return 'wordhurdle-4'
    if (p.includes('wordhurdle-5-letter')) return 'wordhurdle-5'
    if (p.includes('wordhurdle'))          return 'wordhurdle-6'
  }
  return null
}

document.addEventListener('copy', e => {
  const slug = getSlug()
  if (!slug) return
  const text = (e as ClipboardEvent).clipboardData?.getData('text/plain') ?? ''
  if (!text.trim()) return
  chrome.runtime.sendMessage({ type: 'COPY_DETECTED', slug, text })
})
