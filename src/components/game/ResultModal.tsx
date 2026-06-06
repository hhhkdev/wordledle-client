'use client'

import { useState, FormEvent } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Game, GameResult } from '@/types'
import { parseGameResult } from '@/lib/games'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface ResultModalProps {
  game: Game
  open: boolean
  onClose: () => void
  existingResult?: GameResult | null
  onSuccess: (result: GameResult) => void
}

export default function ResultModal({ game, open, onClose, existingResult, onSuccess }: ResultModalProps) {
  const { user } = useAuth()
  const [text, setText] = useState(existingResult?.raw_result ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedResult, setSavedResult] = useState<GameResult | null>(null)

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

  function handleClose() {
    if (savedResult) onSuccess(savedResult)
    setSavedResult(null)
    setError('')
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const parsed = parseGameResult(game.slug, text)
    if (!parsed) {
      setError('결과 형식이 올바르지 않습니다. 게임에서 복사한 텍스트를 그대로 붙여넣어 주세요.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const payload = {
      user_id: user.id,
      game_id: game.id,
      date: today,
      raw_result: text.trim(),
      score: parsed.score,
      attempts: parsed.attempts,
      max_attempts: parsed.max_attempts,
      completed: parsed.completed,
      puzzle_number: parsed.metadata?.puzzle_number ?? null,
      metadata: parsed.metadata ?? {},
    }

    let data: GameResult | null = null
    let err = null

    if (existingResult) {
      const res = await supabase
        .from('results').update(payload).eq('id', existingResult.id).select().single()
      data = res.data as GameResult
      err = res.error
    } else {
      const res = await supabase
        .from('results').upsert(payload, { onConflict: 'user_id,game_id,date' }).select().single()
      data = res.data as GameResult
      err = res.error
    }

    setLoading(false)

    if (err || !data) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      return
    }

    setSavedResult(data)
  }

  // 점수 결과 화면
  if (savedResult) {
    const isSuccess = savedResult.completed
    return (
      <Modal open={open} onClose={handleClose} title={game.name}>
        <div className="text-center py-4">
          {isSuccess ? (
            <>
              <p className="text-5xl font-black tabular-nums mb-1" style={{ color: game.color }}>
                +{savedResult.score}
                <span className="text-2xl font-semibold text-gray-400 ml-1">점</span>
              </p>
              <p className="text-sm font-semibold text-gray-500 mt-1">획득!</p>
              {savedResult.attempts != null && (
                <p className="text-xs text-gray-400 mt-2">
                  {savedResult.attempts}
                  {savedResult.max_attempts ? `/${savedResult.max_attempts}` : ''}번 시도
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl mb-2">😔</p>
              <p className="text-sm font-semibold text-gray-700">오늘은 아쉽게도 실패했어요</p>
              <p className="text-xs text-gray-400 mt-1">결과가 기록됐어요</p>
            </>
          )}
          <Button onClick={handleClose} size="lg" className="w-full mt-6">
            확인
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={`${game.name} 결과 입력`}>
      <p className="text-sm text-gray-500 mb-3">
        게임 결과 공유 텍스트를 그대로 붙여넣어 주세요.
      </p>
      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 mb-4 font-mono leading-relaxed">
        예시: {game.result_format}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="w-full h-36 px-4 py-3 rounded-xl border border-gray-200 text-base sm:text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
          placeholder="결과 텍스트를 붙여넣으세요..."
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          required
        />
        {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {existingResult ? '결과 수정' : '결과 저장'}
        </Button>
      </form>
    </Modal>
  )
}
