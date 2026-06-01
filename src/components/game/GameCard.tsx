'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Edit3, XCircle, Flame, Clock, Brain, ExternalLink, Plus, X, ChevronRight, LogIn } from 'lucide-react'
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

function ScoreChip({ score }: { score: number | null }) {
  if (score == null || score === 0) return null
  return (
    <span className="bg-white/25 rounded-lg px-2 py-0.5 text-xs font-bold text-white">
      +{score}점
    </span>
  )
}

// 그라디언트 카드용 (흰 텍스트 칩)
function ResultStats({ game, result }: { game: Game; result: GameResult }) {
  const meta = result.metadata
  if (game.slug === 'kkomanttle') {
    return (
      <div className="flex flex-wrap gap-1">
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
        {result.completed && <ScoreChip score={result.score} />}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1">
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
      {result.completed && <ScoreChip score={result.score} />}
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
          'relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200',
          hasImage ? 'border border-gray-100' : 'min-h-32.5',
          !hasImage && dimmed && !showChoice && 'grayscale opacity-70',
          hasImage && dimmed && !showChoice && 'opacity-75',
          !showChoice && 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
        )}
        style={undefined}
        onClick={() => setShowChoice(true)}
      >
        {hasImage ? (
          // ── 이미지 카드: 상단 이미지 + 하단 텍스트 ──
          <>
            {/* 이미지 - 더 작은 비율 */}
            <div className="aspect-video overflow-hidden">
              <img src={game.image_url!} alt={game.name}
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

            {/* 텍스트 섹션 - 게임 컬러 배경 */}
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
          </>
        ) : (
          // ── 그라디언트 카드 ──
          <>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(145deg, ${game.color} 0%, ${game.color}bb 100%)` }} />
            <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-black/25" />

            {/* 완료 뱃지 */}
            {hasResult && !showChoice && (
              <div className="absolute top-2.5 right-2.5 z-10">
                {completed
                  ? <CheckCircle2 size={18} className="text-white drop-shadow" />
                  : <XCircle size={18} className="text-white/70 drop-shadow" />}
              </div>
            )}

            {/* 콘텐츠 */}
            <div className="relative z-10 flex flex-col flex-1 p-4">
              <h3 className="text-base font-black text-white leading-tight">{game.name}</h3>
              <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{game.description}</p>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-2">
                {hasResult && result ? <ResultStats game={game} result={result} /> : <div />}
                <ChevronRight size={16} className="text-white/40" />
              </div>
            </div>
          </>
        )}

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
                <div className="w-px bg-white/20 shrink-0" />
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
