'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Users, LogOut, LogIn, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'

const NAV_ITEMS = [
  { href: '/ranking', label: '랭킹', icon: Trophy },
  { href: '/friends', label: '친구', icon: Users },
]

const AUTH_NAV_ITEMS = [
  { href: '/mypage', label: '마이페이지', icon: UserCircle },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (pathname === '/login' || pathname === '/register') return null

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-75 transition-opacity">
          <Logo size="sm" />
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                pathname.startsWith(href)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
              {AUTH_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                    pathname.startsWith(href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                title="로그아웃"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <LogIn size={14} />
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
