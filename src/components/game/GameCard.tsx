'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Edit3, XCircle, Flame, Clock, Brain, ExternalLink, Plus, X, ChevronRight } from 'lucide-react'
import { Game, GameResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import ResultModal from './ResultModal'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: Game
  result?: GameResult | null
  onResultChange: (result: GameResult) => void
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

function ResultStats({ game, result }: { game: Game; result: GameResult }) {
  const meta = result.metadata
  if (game.slug === 'kkomanttle') {
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {result.attempts !== null && (
          <span className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
            <Brain size={10} />{result.attempts}회
          </span>
        )}
        {meta?.time_seconds != null && (
          <span className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
            <Clock size={10} />{formatTime(meta.time_seconds!)}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {result.attempts !== null && (
        <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
          {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
        </span>
      )}
      {game.slug === 'kkodle' && meta?.streak != null && (
        <span className="flex items-center gap-0.5 bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
          <Flame size={10} />{meta.streak}일
        </span>
      )}
    </div>
  )
}

export default function GameCard({ game, result, onResultChange }: GameCardProps) {
  const { user } = useAuth()
  const [showChoice, setShowChoice] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const hasResult = !!result
  const completed = result?.completed
  const hasImage = !!game.image_url

  // 결과 입력한 카드는 그레이스케일 (로그인 유저 한정)
  const dimmed = !!user && hasResult

  // 선택지 오버레이 외부 클릭 시 닫기
  useEffect(() => {
    if (!showChoice) return
    const timer = setTimeout(() => {
      const close = () => setShowChoice(false)
      document.addEventListener('click', close, { once: true })
      return () => document.removeEventListener('click', close)
    }, 0)
    return () => clearTimeout(timer)
  }, [showChoice])

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col rounded-2xl overflow-hidden cursor-pointer',
          'transition-all duration-200',
          hasImage ? 'aspect-4/3' : '',
          dimmed && !showChoice && 'grayscale opacity-70',
          !showChoice && 'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
        )}
        onClick={() => setShowChoice(true)}
      >
        {/* 배경 */}
        {hasImage ? (
          <>
            <img src={game.image_url!} alt={game.name}
              className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            <div className="absolute inset-0 bg-black/45" />
          </>
        ) : (
          <>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(145deg, ${game.color} 0%, ${game.color}bb 100%)` }} />
            <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-black/25" />
          </>
        )}

        {/* 완료 뱃지 */}
        {hasResult && !showChoice && (
          <div className="absolute top-2.5 right-2.5 z-10">
            {completed
              ? <CheckCircle2 size={18} className="text-white drop-shadow" />
              : <XCircle size={18} className="text-white/70 drop-shadow" />}
          </div>
        )}

        {/* 일반 상태 - 항상 렌더링하여 카드 높이 유지 */}
        <div className="relative z-10 flex flex-col flex-1 p-4 gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-black text-white leading-tight">{game.name}</h3>
              <p className="text-xs text-white/70 mt-0.5">{game.description}</p>
            </div>
          </div>

          {hasResult && result && <ResultStats game={game} result={result} />}

          <div className="flex-1" />

          <div className="flex justify-end mt-1">
            <ChevronRight size={16} className="text-white/40" />
          </div>
        </div>

        {/* 선택지 오버레이 */}
        {showChoice && (
          <div
            className="absolute inset-0 z-20 flex flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowChoice(false)}
              className="absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white/80 active:bg-black/60 transition-colors"
            >
              <X size={14} />
            </button>

            {/* 게임하기 (URL 있는 게임만) */}
            {game.url ? (
              <>
                <Link
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-black/50 active:bg-black/70 transition-colors"
                  onClick={() => setShowChoice(false)}
                >
                  <ExternalLink size={16} className="text-white" />
                  <span className="text-white font-black text-sm">게임하기</span>
                </Link>
                <div className="w-px bg-white/20 shrink-0" />
              </>
            ) : null}

            {/* 결과 입력 */}
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-black/50 active:bg-black/70 transition-colors"
              onClick={() => { setShowChoice(false); setModalOpen(true) }}
            >
              {hasResult ? <Edit3 size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
              <span className="text-white font-black text-sm">
                {hasResult ? '결과 수정' : '결과 입력'}
              </span>
            </button>
          </div>
        )}
      </div>

      {user && (
        <ResultModal
          game={game}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          existingResult={result}
          onSuccess={onResultChange}
        />
      )}
    </>
  )
}
