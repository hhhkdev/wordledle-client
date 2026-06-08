// 익스텐션 설치 여부를 사이트가 감지할 수 있도록 마커 삽입
document.documentElement.setAttribute('data-wordledle-ext', '1')

// 사이트 UI 버튼 클릭 이벤트를 받아 background로 relay
document.addEventListener('wordledle-ext-open', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_PANEL' })
})

// 로그인 세션 동기화
function syncUser(): void {
  try {
    const raw = localStorage.getItem('wordledle_user')
    const user = raw ? JSON.parse(raw) : null
    chrome.storage.local.set({ wordledle_user: user })
  } catch {}
}

syncUser()

window.addEventListener('storage', e => {
  if (e.key === 'wordledle_user') syncUser()
})
