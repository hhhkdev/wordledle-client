'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Plus, Edit3, XCircle, Flame, Clock, Brain } from 'lucide-react'
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
      <div className="flex flex-wrap gap-1 mt-1">
        {result.attempts !== null && (
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-bold text-white">
            <Brain size={10} />{result.attempts}회
          </span>
        )}
        {meta?.time_seconds != null && (
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-bold text-white">
            <Clock size={10} />{formatTime(meta.time_seconds!)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      {result.attempts !== null && (
        <span className="bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-bold text-white">
          {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
        </span>
      )}
      {game.slug === 'kkodle' && meta?.streak != null && (
        <span className="flex items-center gap-0.5 bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-bold text-white">
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

  return (
    <>
      {/*
       * 이미지 없을 때: 콤팩트 카드 (고정 비율 없음)
       * 이미지 있을 때: aspect-4/3 (800×600px 권장, 안전영역 상단 40%)
       */}
      <div className={cn(
        'relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group',
        hasImage && 'aspect-4/3'
      )}>
        {/* 배경 */}
        {hasImage ? (
          <>
            <img
              src={game.image_url!}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/45" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(145deg, ${game.color} 0%, ${game.color}bb 100%)` }}
            />
            <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-black/25" />
          </>
        )}

        {/* 완료 뱃지 */}
        {hasResult && (
          <div className="absolute top-2.5 right-2.5 z-10">
            {completed ? (
              <CheckCircle2 size={18} className="text-white drop-shadow" />
            ) : (
              <XCircle size={18} className="text-white/70 drop-shadow" />
            )}
          </div>
        )}

        {/* 전체 카드를 게임 링크로 */}
        <Link
          href={game.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={`${game.name} 게임하기`}
        />

        {/* 콘텐츠 */}
        <div className="relative z-10 flex flex-col flex-1 p-3.5 gap-1.5">
          {/* 이모지 + 타이틀 */}
          <div className="flex items-center gap-2">
            <span className={cn('leading-none', hasImage ? 'text-2xl' : 'text-xl')}>{game.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white leading-tight truncate">{game.name}</h3>
              <p className="text-xs text-white/65 mt-0.5 truncate">{game.description}</p>
            </div>
          </div>

          {/* 결과 stats */}
          {hasResult && result && <ResultStats game={game} result={result} />}

          {!hasImage && <div className="flex-1 min-h-3" />}

          {/* 결과 입력 버튼 */}
          {user && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setModalOpen(true) }}
              className={cn(
                'relative z-20 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-colors mt-1',
                hasResult
                  ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm'
                  : 'bg-white text-gray-900 hover:bg-white/90'
              )}
            >
              {hasResult ? <Edit3 size={12} /> : <Plus size={12} />}
              {hasResult ? '결과 수정' : '결과 입력'}
            </button>
          )}
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
