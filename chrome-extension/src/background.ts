import { supabase } from './lib/supabase'
import { parseGameResult } from './lib/parser'

chrome.runtime.onInstalled.addListener(() => {
  // 아이콘 클릭 시 사이드 패널 열기
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.runtime.onMessage.addListener(
  (msg: Record<string, unknown>, _sender, sendResponse) => {
    // 복사 감지 → 사이드 패널용 스토리지 저장 + 배지
    if (msg.type === 'COPY_DETECTED') {
      const { slug, text } = msg as { slug: string; text: string }
      chrome.storage.local.set({ pending_result: { slug, text, ts: Date.now() } })
      return false
    }

    // 저장 요청 (content-game.ts의 플로팅 패널에서 호출)
    if (msg.type === 'SAVE_RESULT') {
      const { slug, text } = msg as { slug: string; text: string };
      (async () => {
        const { wordledle_user: user } = await chrome.storage.local.get('wordledle_user')
        if (!user) return sendResponse({ ok: false })
        sendResponse(await saveResult(slug, text, user as { id: string }))
      })()
      return true // 비동기 응답을 위해 채널 유지
    }

    return false
  }
)

async function saveResult(
  slug: string,
  rawText: string,
  user: { id: string },
): Promise<{ ok: boolean }> {
  try {
    const parsed = parseGameResult(slug, rawText)
    if (!parsed) return { ok: false }

    const { data: gameRow, error: gameErr } = await supabase
      .from('games').select('id').eq('slug', slug).single()
    if (gameErr || !gameRow) return { ok: false }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

    const { error } = await supabase.from('results').upsert({
      user_id:       user.id,
      game_id:       gameRow.id,
      date:          today,
      raw_result:    rawText.trim(),
      score:         parsed.score,
      attempts:      parsed.attempts,
      max_attempts:  parsed.max_attempts,
      completed:     parsed.completed,
      puzzle_number: (parsed.metadata.puzzle_number as number | null) ?? null,
      metadata:      parsed.metadata,
    }, { onConflict: 'user_id,game_id,date' })

    if (error) return { ok: false }

    // 저장 성공 시 스토리지 정리
    chrome.storage.local.remove('pending_result')
    chrome.action.setBadgeText({ text: '' })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
