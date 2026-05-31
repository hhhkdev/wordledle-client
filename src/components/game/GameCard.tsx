'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, CheckCircle2, Plus, Edit3, XCircle, Flame, Clock, Brain } from 'lucide-react'
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

  // 꼬맨틀: 추측 횟수 + 시간 + 유사도
  if (game.slug === 'kkomanttle') {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {result.attempts !== null && (
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
            <Brain size={12} />
            {result.attempts}회
          </span>
        )}
        {meta?.time_seconds !== null && meta?.time_seconds !== undefined && (
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
            <Clock size={12} />
            {formatTime(meta.time_seconds)}
          </span>
        )}
      </div>
    )
  }

  // Wordle-style: 시도 횟수 + 스트릭(꼬들 전용)
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {result.attempts !== null && (
        <span className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
          {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
        </span>
      )}
      {game.slug === 'kkodle' && meta?.streak != null && (
        <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-bold text-white">
          <Flame size={12} />
          {meta.streak}일
        </span>
      )}
    </div>
  )
}

export default function GameCard({ game, result, onResultChange }: GameCardProps) {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const hasResult = !!result
  const completed = result?.completed

  return (
    <>
      <div
        className="relative group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
        style={{ minHeight: 200 }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: game.color }} />
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10 rounded-t-2xl" />

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

        <div className="relative z-10 flex flex-col flex-1 p-5 gap-2">
          <div className="text-4xl leading-none mb-1">{game.emoji}</div>

          <div>
            <h3 className="text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              {game.name}
            </h3>
            <p className="text-sm text-white/75 font-medium mt-0.5">{game.description}</p>
          </div>

          {hasResult && result && (
            <ResultStats game={game} result={result} />
          )}

          <div className="flex-1" />

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
