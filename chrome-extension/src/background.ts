// 익스텐션 설치/업데이트 시 사이드 패널 동작 설정
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.runtime.onMessage.addListener(
  (msg: unknown, sender: chrome.runtime.MessageSender) => {
    if (!msg || typeof msg !== 'object') return
    const { type, slug, text } = msg as { type: string; slug: string; text: string }
    if (type !== 'COPY_DETECTED') return

    // 감지된 결과를 storage에 저장
    chrome.storage.local.set({ pending_result: { slug, text, ts: Date.now() } })

    const tabId = sender.tab?.id
    if (tabId == null) return

    // 배지로 감지 알림 (패널 자동 열기 실패 시 fallback)
    chrome.action.setBadgeText({ text: '!', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#3B82F6', tabId })

    // Chrome 116+: 복사 이벤트(user gesture)로 트리거된 경우 패널 자동 열기
    chrome.sidePanel.open({ tabId }).catch(() => {
      // 권한 제한으로 실패해도 배지가 있으므로 사용자가 직접 열 수 있음
    })
  }
)
