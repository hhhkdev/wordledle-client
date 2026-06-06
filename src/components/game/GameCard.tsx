'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}


export default function GameCard({ game, result, onResultChange }: GameCardProps) {
  const { user } = useAuth()
  const [showChoice, setShowChoice] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const hasResult = !!result
  const completed = result?.completed
  const imageUrl = getGameImageUrl(game.slug, game.image_url)
  const dimmed = !!user && hasResult
  const lightBg = isLightColor(game.color)
  const textPrimary = lightBg ? 'text-gray-900' : 'text-white'
  const textSecondary = lightBg ? 'text-gray-500' : 'text-white/70'
  const chipBg = lightBg ? 'bg-black/10 text-gray-800' : 'bg-white/20 text-white'

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
          completed && !showChoice && 'grayscale',
          dimmed && !showChoice && 'opacity-80',
          !showChoice && 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
        )}
        style={undefined}
        onClick={() => setShowChoice(true)}
      >
        {/* 이미지 or 색상 플레이스홀더 */}
        {imgFailed ? (
          <div className="relative aspect-video" style={{ backgroundColor: game.color + '33' }}>
            {completed && !showChoice && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                  <CheckCircle2 size={15} className="text-green-500" />
                  <span className="text-sm font-black text-gray-800">완료</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={imageUrl}
              alt={game.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              draggable={false}
              unoptimized={!imageUrl.includes('.supabase.co')}
              onError={() => setImgFailed(true)}
            />
            {completed && !showChoice && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                  <CheckCircle2 size={15} className="text-green-500" />
                  <span className="text-sm font-black text-gray-800">완료</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 실패 뱃지 */}
        {hasResult && !completed && !showChoice && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm bg-red-400">
              <XCircle size={13} className="text-white" />
            </div>
          </div>
        )}

        {/* 텍스트 섹션 */}
        <div className="flex-1 flex flex-col px-3 py-2.5" style={{ backgroundColor: game.color }}>
          <div className="flex items-start justify-between gap-1">
            <p className={cn('text-sm font-black leading-tight truncate', textPrimary)}>{game.name}</p>
            <ChevronRight size={14} className={cn('shrink-0 mt-0.5', textSecondary)} />
          </div>
          {hasResult && result ? (
            <div className="flex items-center gap-1 flex-wrap mt-1.5">
              {result.attempts != null && (
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', chipBg)}>
                  {result.attempts}{result.max_attempts ? `/${result.max_attempts}` : ''}번
                </span>
              )}
              {result.completed && result.score != null && result.score > 0 ? (
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', chipBg)}>
                  +{result.score}점
                </span>
              ) : !result.completed ? (
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', chipBg)}>실패</span>
              ) : null}
            </div>
          ) : (
            <p className={cn('text-xs mt-0.5 line-clamp-2 leading-tight', textSecondary)}>{game.description}</p>
          )}
        </div>

        {/* 선택지 오버레이 */}
        {showChoice && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 bg-black/65"
            onClick={() => setShowChoice(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowChoice(false) }}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/40 transition-colors"
            >
              <X size={13} />
            </button>

            {game.url && (
              <Link
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { e.stopPropagation(); setShowChoice(false) }}
                className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
              >
                <ExternalLink size={14} />
                게임하기
              </Link>
            )}

            {user ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowChoice(false); setModalOpen(true) }}
                className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
              >
                {hasResult ? <Edit3 size={14} /> : <Plus size={14} />}
                {hasResult ? '결과 수정' : '결과 입력'}
              </button>
            ) : (
              <Link
                href="/login"
                onClick={(e) => { e.stopPropagation(); setShowChoice(false) }}
                className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
              >
                <LogIn size={14} />
                로그인하여 기록
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
