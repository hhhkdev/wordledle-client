'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus, RefreshCw } from 'lucide-react'
import FeedbackModal from './FeedbackModal'
import { CURRENT_VERSION } from '@/lib/version'

export default function Footer() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  function handleHardRefresh() {
    setRefreshing(true)
    // Next.js 서버 캐시 무효화 후 브라우저 강제 새로고침 (이미지 캐시 포함)
    router.refresh()
    setTimeout(() => window.location.reload(), 100)
  }

  return (
    <>
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-black text-gray-500">WORDLEDLE</span>
            <span>{CURRENT_VERSION}</span>
            <span>·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleHardRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
              title="캐시를 무시하고 강제 새로고침"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              새로고침
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <MessageSquarePlus size={14} />
              피드백 보내기
            </button>
          </div>
        </div>
      </footer>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
