'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Users, LogOut, LogIn, UserCircle, ShieldCheck, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'

const NAV_ITEMS = [
  { href: '/wordledle', label: '워들들', icon: Gamepad2 },
  { href: '/ranking', label: '랭킹', icon: Trophy },
  { href: '/friends', label: '친구', icon: Users },
]


export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [hasExt, setHasExt] = useState(false)

  // 크롬 익스텐션 설치 여부 감지 (content script가 data-wordledle-ext 마커를 삽입)
  useEffect(() => {
    const check = () =>
      setHasExt(document.documentElement.hasAttribute('data-wordledle-ext'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-wordledle-ext'] })
    return () => obs.disconnect()
  }, [])

  function handleOpenPanel() {
    document.dispatchEvent(new CustomEvent('wordledle-ext-open'))
  }

  function handleLogout() {
    logout()
    router.push('/')
    setConfirmOpen(false)
  }

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="hover:opacity-75 transition-opacity shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                pathname.startsWith(href)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              )}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}

          {hasExt && (
            <button
              onClick={handleOpenPanel}
              title="익스텐션 패널 열기"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              📋
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-gray-200">
              {user.is_admin && (
                <Link
                  href="/admin"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-red-100 text-red-700'
                      : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                  )}
                >
                  <ShieldCheck size={15} />
                  <span className="hidden sm:inline">어드민</span>
                </Link>
              )}
              <Link
                href={`/users/${encodeURIComponent(user.nickname)}`}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  pathname.startsWith('/users/')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                )}
              >
                <UserCircle size={16} />
                <span className="hidden sm:inline">{user.nickname}</span>
              </Link>
              <button
                onClick={() => setConfirmOpen(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <LogIn size={14} />
              <span className="hidden xs:inline">로그인</span>
              <span className="xs:hidden sr-only">로그인</span>
            </Link>
          )}
        </nav>
      </div>
    </header>

    {/* 로그아웃 확인 모달 */}
    {confirmOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={() => setConfirmOpen(false)}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-base font-black text-gray-900 mb-1">로그아웃할까요?</p>
          <p className="text-sm text-gray-500 mb-6">다시 로그인하면 기록을 이어서 볼 수 있어요.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold"
            >
              취소
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
