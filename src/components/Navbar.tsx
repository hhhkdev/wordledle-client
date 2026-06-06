'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Users, LogOut, LogIn, UserCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from './Logo'

const NAV_ITEMS = [
  { href: '/ranking', label: '랭킹', icon: Trophy },
  { href: '/friends', label: '친구', icon: Users },
]


export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
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
                onClick={handleLogout}
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
  )
}
