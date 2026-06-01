'use client'

import { useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

const VERSION = 'v0.0.2'

export default function Footer() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <>
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-black text-gray-500">WORDLEDLE</span>
            <span>{VERSION}</span>
            <span>·</span>
            <span>© 2026</span>
          </div>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            <MessageSquarePlus size={14} />
            피드백 보내기
          </button>
        </div>
      </footer>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
