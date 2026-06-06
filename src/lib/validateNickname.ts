const ALLOWED_RE = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9_.‐-]+$/
const RESERVED = ['admin', '관리자', 'system', 'wordledle', 'mod', '운영자', 'root', 'staff', '운영팀']

export function validateNickname(nickname: string): string | null {
  const v = nickname.trim()

  if (v.length < 2) return '닉네임은 2자 이상이어야 합니다.'
  if (v.length > 16) return '닉네임은 16자 이하여야 합니다.'
  if (/\s/.test(v)) return '공백은 사용할 수 없습니다.'
  if (!ALLOWED_RE.test(v)) return '한글, 영문, 숫자, _, -, . 만 사용할 수 있습니다.'
  if (RESERVED.some(r => v.toLowerCase() === r.toLowerCase())) return '사용할 수 없는 닉네임입니다.'

  return null
}
