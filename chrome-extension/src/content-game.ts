import { parseGameResult, GAME_NAMES, type ParsedResult } from './lib/parser'

// ── 게임 슬러그 감지 ──────────────────────────────────
const SLUG_MAP: Record<string, string> = {
  'www.nytimes.com':        'wordle',
  'kordle.kr':              'kkodle',
  'koooo.kordle.kr':        'kkooooodle',
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

// ── 복사 감지 ────────────────────────────────────────
document.addEventListener('copy', async e => {
  const slug = getSlug()
  if (!slug) return

  const text = (e as ClipboardEvent).clipboardData?.getData('text/plain') ?? ''
  if (!text.trim()) return

  const parsed = parseGameResult(slug, text)
  if (!parsed) return // 인식되지 않는 텍스트

  // 사이드 패널용 스토리지 동기화 (아이콘 클릭으로 패널 열었을 때 사용)
  chrome.runtime.sendMessage({ type: 'COPY_DETECTED', slug, text })

  const { wordledle_user: user } = await chrome.storage.local.get('wordledle_user')
  showPanel(slug, text, parsed, user ?? null)
})

// ── 플로팅 패널 ───────────────────────────────────────
let hostEl: HTMLElement | null = null

type User = { id: string; nickname: string }

function showPanel(slug: string, rawText: string, parsed: ParsedResult, user: User | null): void {
  hostEl?.remove()

  hostEl = document.createElement('div')
  hostEl.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647'
  document.body.appendChild(hostEl)

  const shadow = hostEl.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>${PANEL_CSS}</style>${buildCardHTML(slug, parsed, user)}`

  shadow.getElementById('close')?.addEventListener('click', () => hostEl?.remove())

  if (!user) return

  shadow.getElementById('save')?.addEventListener('click', async () => {
    const btn = shadow.getElementById('save') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = '저장 중...'

    const res: { ok: boolean } = await chrome.runtime.sendMessage({ type: 'SAVE_RESULT', slug, text: rawText })

    if (res?.ok) {
      shadow.querySelector<HTMLElement>('.body')!.innerHTML = buildSuccessHTML(parsed)
      shadow.getElementById('done')?.addEventListener('click', () => hostEl?.remove())
    } else {
      btn.disabled = false
      btn.textContent = '저장하기'
      let errEl = shadow.getElementById('err')
      if (!errEl) {
        errEl = Object.assign(document.createElement('p'), { id: 'err' })
        errEl.setAttribute('style', 'color:#ef4444;font-size:12px;text-align:center;margin:8px 0 0')
        shadow.querySelector('.body')?.appendChild(errEl)
      }
      errEl.textContent = '저장에 실패했어요. 다시 시도해주세요.'
    }
  })
}

// ── HTML 템플릿 ───────────────────────────────────────
function buildCardHTML(slug: string, parsed: ParsedResult, user: User | null): string {
  const isOk   = parsed.completed
  const score  = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`
  const att    = parsed.attempts != null
    ? `${parsed.attempts}${parsed.max_attempts ? `/${parsed.max_attempts}` : ''}번 시도`
    : ''

  return `
    <div class="card">
      <div class="header">
        <span class="logo">WORDLEDLE</span>
        <button id="close" class="close-btn">✕</button>
      </div>
      <div class="body">
        <p class="game-label">${GAME_NAMES[slug] ?? slug}</p>
        <div class="score-row">
          <span class="score ${isOk ? 'ok' : 'fail'}">${score}</span>
          <span class="badge ${isOk ? 'ok' : 'fail'}">${isOk ? '클리어' : '실패'}</span>
        </div>
        ${att ? `<p class="attempts">${att}</p>` : ''}
        ${user
          ? `<button id="save" class="btn-save">저장하기</button>`
          : `<p class="login-hint">저장하려면 <a href="https://wordledle-client.vercel.app" target="_blank">WORDLEDLE</a>에 로그인하세요</p>`
        }
      </div>
    </div>`
}

function buildSuccessHTML(parsed: ParsedResult): string {
  const score = `${parsed.score > 0 ? '+' : ''}${parsed.score}점`
  return `
    <div class="success-body">
      <p class="success-emoji">🎉</p>
      <p class="success-score">${score}</p>
      <p class="success-msg">WORDLEDLE에 저장됐어요!</p>
      <button id="done" class="btn-done">확인</button>
    </div>`
}

// ── 스타일 ───────────────────────────────────────────
const PANEL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .card {
    width: 270px;
    background: #fff;
    border-radius: 20px;
    border: 1px solid #f3f4f6;
    box-shadow: 0 12px 40px rgba(0,0,0,.13), 0 2px 10px rgba(0,0,0,.06);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
    animation: rise .22s cubic-bezier(.16,1,.3,1);
  }
  @keyframes rise {
    from { opacity:0; transform:translateY(10px) scale(.95) }
    to   { opacity:1; transform:translateY(0)   scale(1)   }
  }
  .header {
    display:flex; align-items:center; justify-content:space-between;
    padding: 12px 14px 10px;
    border-bottom: 1px solid #f9fafb;
  }
  .logo { font-size:12px; font-weight:900; color:#111827; letter-spacing:-.02em; }
  .close-btn {
    width:22px; height:22px; display:flex; align-items:center; justify-content:center;
    border:none; background:transparent; cursor:pointer;
    font-size:13px; color:#9ca3af; border-radius:6px;
  }
  .close-btn:hover { background:#f3f4f6; color:#374151; }
  .body { padding:14px 14px 16px; }
  .game-label {
    font-size:10px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    color:#9ca3af; margin-bottom:10px;
  }
  .score-row { display:flex; align-items:center; justify-content:space-between; }
  .score { font-size:28px; font-weight:900; line-height:1; }
  .score.ok   { color:#111827; }
  .score.fail { color:#ef4444; }
  .badge {
    font-size:11px; font-weight:700; padding:4px 10px; border-radius:99px;
  }
  .badge.ok   { background:#dcfce7; color:#15803d; }
  .badge.fail { background:#fee2e2; color:#ef4444; }
  .attempts { font-size:12px; color:#9ca3af; margin-top:4px; }
  .btn-save {
    display:block; width:100%; margin-top:14px; padding:11px;
    background:#111827; color:#fff;
    border:none; border-radius:12px;
    font-size:13px; font-weight:800; cursor:pointer;
    transition:opacity .15s;
  }
  .btn-save:hover:not(:disabled) { opacity:.82; }
  .btn-save:disabled { opacity:.45; cursor:default; }
  .login-hint {
    font-size:12px; color:#9ca3af; text-align:center;
    line-height:1.6; margin-top:14px;
  }
  .login-hint a { color:#3b82f6; font-weight:600; text-decoration:none; }
  /* 성공 화면 */
  .success-body {
    padding:20px 14px 18px;
    display:flex; flex-direction:column; align-items:center; text-align:center;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;
  }
  .success-emoji { font-size:30px; margin-bottom:10px; }
  .success-score { font-size:26px; font-weight:900; color:#111827; }
  .success-msg   { font-size:13px; color:#6b7280; margin-top:4px; }
  .btn-done {
    margin-top:16px; padding:9px 22px;
    background:#f3f4f6; color:#374151;
    border:none; border-radius:10px;
    font-size:13px; font-weight:700; cursor:pointer;
    transition:background .15s;
  }
  .btn-done:hover { background:#e5e7eb; }
`
