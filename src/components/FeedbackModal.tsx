'use client'

import { useState, FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const MAX = 500

  function handleClose() {
    setContent('')
    setDone(false)
    setError('')
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      content: content.trim(),
    })

    setLoading(false)

    if (err) {
      setError('전송에 실패했습니다. 다시 시도해 주세요.')
      return
    }

    setDone(true)
  }

  return (
    <Modal open={open} onClose={handleClose} title="피드백 보내기">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-base font-bold text-gray-900">피드백이 전송되었습니다</p>
          <p className="text-sm text-gray-500">소중한 의견 감사해요. 서비스 개선에 반영할게요!</p>
          <Button onClick={handleClose} variant="secondary" size="md" className="mt-2">
            닫기
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-1">
            불편한 점, 개선 아이디어, 버그 제보 등 무엇이든 남겨주세요.
            {user && <span className="text-gray-400"> ({user.nickname} 으로 전송)</span>}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
            <div className="relative">
              <textarea
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                placeholder="내용을 입력하세요..."
                value={content}
                onChange={e => { setContent(e.target.value); setError('') }}
                maxLength={MAX}
                required
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-300 select-none">
                {content.length}/{MAX}
              </span>
            </div>
            {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!content.trim()}
              className="w-full bg-gray-900! hover:bg-gray-700!"
            >
              보내기
            </Button>
          </form>
        </>
      )}
    </Modal>
  )
}
