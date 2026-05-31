import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'

// Simple hash using Web Crypto API — suitable for this app's scope
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'wordledle_salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function register(nickname: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname)
    .single()

  if (existing) {
    return { user: null, error: '이미 사용 중인 닉네임입니다.' }
  }

  const password_hash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({ nickname, password_hash })
    .select('id, nickname, created_at')
    .single()

  if (error || !data) {
    return { user: null, error: '회원가입에 실패했습니다.' }
  }

  return { user: data as User, error: null }
}

export async function login(nickname: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const supabase = createClient()
  const password_hash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, created_at')
    .eq('nickname', nickname)
    .eq('password_hash', password_hash)
    .single()

  if (error || !data) {
    return { user: null, error: '닉네임 또는 비밀번호가 올바르지 않습니다.' }
  }

  return { user: data as User, error: null }
}
