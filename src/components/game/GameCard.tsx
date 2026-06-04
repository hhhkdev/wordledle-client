'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Edit3, XCircle, ExternalLink, Plus, X, ChevronRight, LogIn } from 'lucide-react'
import { Game, GameResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import ResultModal from './ResultModal'
import { cn } from '@/lib/utils'
import { getGameImageUrl } from '@/lib/games'

interface GameCardProps {
  game: Game
  result?: GameResult | null
  onResultChange: (result: GameResult) => void
}


export default function GameCard({ game, result, onResultChange }: GameCardProps) {
  const { user } = useAuth()
  const [showChoice, setShowChoice] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const hasResult = !!result
  const completed = result?.completed
  const imageUrl = getGameImageUrl(game.slug, game.image_url)
  const dimmed = !!user && hasResult

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
          'relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border border-gray-100',
          dimmed && !showChoice && 'opacity-75',
          !showChoice && 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
        )}
        style={undefined}
        onClick={() => setShowChoice(true)}
      >
        {/* 이미지 */}
        <div className="aspect-video overflow-hidden">
          <img src={imageUrl} alt={game.name}
            className="w-full h-full object-cover" draggable={false} />
        </div>

        {/* 완료 뱃지 */}
        {hasResult && !showChoice && (
          <div className="absolute top-2 right-2 z-10">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shadow-sm',
              completed ? 'bg-green-500' : 'bg-red-400')}>
              {completed
                ? <CheckCircle2 size={13} className="text-white" />
                : <XCircle size={13} className="text-white" />}
            </div>
          </div>
        )}

        {/* 텍스트 섹션 */}
        <div className="flex-1 flex flex-col px-3 py-2.5" style={{ backgroundColor: game.color }}>
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-black text-white leading-tight truncate">{game.name}</p>
            <ChevronRight size={14} className="text-white/50 shrink-0 mt-0.5" />
          </div>
          {hasResult && result ? (
            <div className="flex items-center gap-1 flex-wrap mt-1.5">
              {result.attempts != null && (
                <span className="bg-white/20 text-white rounded-md px-1.5 py-0.5 text-xs font-bold">
                  {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
                </span>
              )}
              {result.completed && result.score != null && result.score > 0 ? (
                <span className="bg-white/20 text-white rounded-md px-1.5 py-0.5 text-xs font-bold">
                  +{result.score}점
                </span>
              ) : !result.completed ? (
                <span className="bg-white/20 text-white rounded-md px-1.5 py-0.5 text-xs font-bold">실패</span>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-white/70 mt-0.5 line-clamp-2 leading-tight">{game.description}</p>
          )}
        </div>

        {/* 선택지 오버레이 */}
        {showChoice && (
          <div
            className="absolute inset-0 z-20 flex flex-row"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowChoice(false)}
              className="absolute top-2 right-2 z-30 w-7 h-7 flex items-center justify-center rounded-full bg-black/30 text-white/80 active:bg-black/60 transition-colors"
            >
              <X size={13} />
            </button>

            {game.url ? (
              <>
                <Link
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-black/80 active:bg-black/90 transition-colors"
                  onClick={() => setShowChoice(false)}
                >
                  <ExternalLink size={14} className="text-white" />
                  <span className="text-white font-black text-xs">게임하기</span>
                </Link>
                <div className="w-px bg-white/50 shrink-0" />
              </>
            ) : null}

            {user ? (
              <button
                className="flex-1 flex items-center justify-center gap-1.5 bg-black/80 active:bg-black/90 transition-colors"
                onClick={() => { setShowChoice(false); setModalOpen(true) }}
              >
                {hasResult ? <Edit3 size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
                <span className="text-white font-black text-xs">
                  {hasResult ? '결과 수정' : '결과 입력'}
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex-1 flex items-center justify-center gap-1.5 bg-black/80 active:bg-black/90 transition-colors"
                onClick={() => setShowChoice(false)}
              >
                <LogIn size={14} className="text-white" />
                <span className="text-white font-black text-xs">로그인하여 기록</span>
              </Link>
            )}
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
