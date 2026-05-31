'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Plus, Edit3, XCircle, Flame, Clock, Brain, ArrowUpRight } from 'lucide-react'
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
  const [modalOpen, setModalOpen] = useState(false)

  const hasResult = !!result
  const completed = result?.completed
  const hasImage = !!game.image_url
  // 로그인한 유저가 아직 결과를 입력하지 않은 경우만 그레이스케일
  const dimmed = !!user && !hasResult

  return (
    <>
      <Link
        href={game.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200',
          'hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          hasImage ? 'aspect-4/3' : '',
          dimmed && 'grayscale opacity-75 hover:grayscale-0 hover:opacity-100'
        )}
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
        {hasResult && (
          <div className="absolute top-2.5 right-2.5 z-10">
            {completed
              ? <CheckCircle2 size={18} className="text-white drop-shadow" />
              : <XCircle size={18} className="text-white/70 drop-shadow" />}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="relative z-10 flex flex-col flex-1 p-4 gap-1">
          {/* 게임명 + 게임하기 표시 */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-black text-white leading-tight">{game.name}</h3>
              <p className="text-xs text-white/70 mt-0.5">{game.description}</p>
            </div>
            {/* 게임하기 힌트 (미완료 또는 비로그인 시) */}
            {!hasResult && (
              <span className="shrink-0 flex items-center gap-0.5 bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-lg mt-0.5">
                게임하기 <ArrowUpRight size={11} />
              </span>
            )}
          </div>

          {/* 결과 stats */}
          {hasResult && result && <ResultStats game={game} result={result} />}

          <div className="flex-1" />

          {/* 결과 입력 버튼 */}
          {user && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setModalOpen(true) }}
              className={cn(
                'mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold transition-colors',
                hasResult
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-white text-gray-900 hover:bg-white/90'
              )}
            >
              {hasResult ? <Edit3 size={13} /> : <Plus size={13} />}
              {hasResult ? '결과 수정' : '결과 입력'}
            </button>
          )}
        </div>
      </Link>

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
