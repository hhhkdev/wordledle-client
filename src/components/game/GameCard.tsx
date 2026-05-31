'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, CheckCircle2, Plus, Edit3, XCircle } from 'lucide-react'
import { Game, GameResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import ResultModal from './ResultModal'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: Game
  result?: GameResult | null
  onResultChange: (result: GameResult) => void
}

export default function GameCard({ game, result, onResultChange }: GameCardProps) {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const hasResult = !!result
  const completed = result?.completed

  return (
    <>
      <div
        className="relative group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-default"
        style={{ minHeight: 200 }}
      >
        {/* Full color background */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: game.color }}
        />
        {/* Subtle dark overlay for depth */}
        <div className="absolute inset-0 bg-black/15" />
        {/* Lighter top highlight */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10 rounded-t-2xl" />

        {/* Completion badge */}
        {hasResult && (
          <div className="absolute top-3 right-3 z-10">
            {completed ? (
              <div className="flex items-center gap-1 bg-white/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <CheckCircle2 size={13} className="text-white" />
                <span className="text-xs font-bold text-white">완료</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <XCircle size={13} className="text-white/80" />
                <span className="text-xs font-semibold text-white/80">실패</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 p-5 gap-2">
          {/* Emoji */}
          <div className="text-4xl leading-none mb-1">{game.emoji}</div>

          {/* Name & description */}
          <div>
            <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              {game.name}
            </h3>
            <p className="text-sm text-white/75 font-medium mt-0.5">{game.description}</p>
          </div>

          {/* Result stats */}
          {hasResult && result.attempts !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
                {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
              </span>
              {result.score !== null && result.score !== undefined && (
                <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
                  {result.score}점
                </span>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
            >
              <ExternalLink size={14} />
              게임하기
            </Link>

            {user && (
              <button
                onClick={() => setModalOpen(true)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors',
                  hasResult
                    ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm'
                    : 'bg-white text-gray-900 hover:bg-white/90'
                )}
              >
                {hasResult ? <Edit3 size={14} /> : <Plus size={14} />}
                {hasResult ? '수정' : '결과 입력'}
              </button>
            )}
          </div>
        </div>
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
