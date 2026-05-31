'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Feedback } from '@/types'
import { MessageSquare, User as UserIcon, Clock } from 'lucide-react'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (!user.is_admin) { router.push('/'); return }

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('feedback')
        .select('*, user:users(id, nickname)')
        .order('created_at', { ascending: false })

      if (data) setFeedbacks(data as Feedback[])
      setLoading(false)
    }
    load()
  }, [user, authLoading, router])

  if (authLoading || !user?.is_admin) return null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">어드민</h1>
          <p className="text-sm text-gray-500 mt-0.5">피드백 관리</p>
        </div>
        <span className="text-xs font-bold bg-red-100 text-red-600 px-3 py-1.5 rounded-full">
          ADMIN
        </span>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="전체 피드백" value={feedbacks.length} icon={<MessageSquare size={16} />} />
        <StatCard
          label="로그인 유저 피드백"
          value={feedbacks.filter(f => f.user_id).length}
          icon={<UserIcon size={16} />}
        />
        <StatCard
          label="익명 피드백"
          value={feedbacks.filter(f => !f.user_id).length}
          icon={<Clock size={16} />}
        />
      </div>

      {/* 피드백 목록 */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm font-semibold">아직 피드백이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {feedbacks.map(fb => (
            <div key={fb.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-700">
                  {(fb.user as { nickname?: string } | null)?.nickname ?? '익명'}
                </span>
                {fb.user_id && (
                  <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                    회원
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {formatDateTime(fb.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{fb.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 text-gray-400 mb-2">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  )
}
