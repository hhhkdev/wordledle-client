chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

// 사이트 버튼 → content script → 여기서 패널 열기
// click에서 시작된 user gesture가 message로 전파되어 sidePanel.open() 허용됨
chrome.runtime.onMessage.addListener((msg: unknown, sender) => {
  if (
    msg && typeof msg === 'object' &&
    (msg as { type: string }).type === 'OPEN_PANEL' &&
    sender.tab?.id != null
  ) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {})
  }
})
