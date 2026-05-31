'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { register } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const { login: setUser } = useAuth()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ nickname?: string; password?: string; confirm?: string }>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (nickname.trim().length < 2) e.nickname = '닉네임은 2자 이상이어야 합니다.'
    if (nickname.trim().length > 16) e.nickname = '닉네임은 16자 이하여야 합니다.'
    if (password.length < 4) e.password = '비밀번호는 4자 이상이어야 합니다.'
    if (password !== confirm) e.confirm = '비밀번호가 일치하지 않습니다.'
    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setErrors({})

    const { user, error } = await register(nickname.trim(), password)

    if (error || !user) {
      setErrors({ nickname: error || '회원가입에 실패했습니다.' })
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
          <h2 className="text-lg font-bold text-gray-900 mb-5">회원가입</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="nickname"
              label="닉네임"
              type="text"
              placeholder="2-16자"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              autoFocus
              error={errors.nickname}
            />
            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="4자 이상"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              error={errors.password}
            />
            <Input
              id="confirm"
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              error={errors.confirm}
            />
            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full rounded-xl! bg-gray-900! hover:bg-gray-700!">
              회원가입
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-gray-900 font-bold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
