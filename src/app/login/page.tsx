'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { login } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const { login: setUser } = useAuth()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || !password) return

    setLoading(true)
    setError('')

    const { user, error: err } = await login(nickname.trim(), password)

    if (err || !user) {
      setError(err || '로그인에 실패했습니다.')
      setLoading(false)
      return
    }

    setUser(user)
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Logo size="lg" />
          <p className="text-gray-500 text-sm text-center leading-relaxed">
            워들 게임 결과를 기록하고<br />친구들과 랭킹을 겨루세요
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">로그인</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="nickname"
              label="닉네임"
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              autoFocus
            />
            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              error={error}
            />
            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full rounded-xl! bg-gray-900! hover:bg-gray-700!">
              로그인
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-gray-900 font-bold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
