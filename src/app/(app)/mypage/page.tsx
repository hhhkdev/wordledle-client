'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function MyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (user) router.replace(`/users/${encodeURIComponent(user.nickname)}`)
    else router.replace('/login')
  }, [user, loading, router])

  return null
}
