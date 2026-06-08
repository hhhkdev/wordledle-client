// wordledle 사이트의 로그인 세션을 extension storage에 동기화

function syncUser(): void {
  try {
    const raw = localStorage.getItem('wordledle_user')
    const user = raw ? JSON.parse(raw) : null
    chrome.storage.local.set({ wordledle_user: user })
  } catch {}
}

syncUser()

// 로그인/로그아웃 시 실시간 반영
window.addEventListener('storage', e => {
  if (e.key === 'wordledle_user') syncUser()
})
