'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Edit3, XCircle, ExternalLink, Plus, X, ChevronRight, LogIn, Gamepad2 } from 'lucide-react'
import { Game, GameResult } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import ResultModal from './ResultModal'
import { cn } from '@/lib/utils'
import { getGameImageUrl } from '@/lib/games'

interface GameCardProps {
  game: Game
  result?: GameResult | null
  onResultChange: (result: GameResult) => void
  priority?: boolean
}

function isLightColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export default function GameCard({ game, result, onResultChange, priority = false }: GameCardProps) {
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
          hasResult && !showChoice && 'grayscale',
          dimmed && !showChoice && 'opacity-80',
          !showChoice && 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        )}
        onClick={() => setShowChoice(true)}
      >
        {/* 이미지 */}
        {imgFailed ? (
          <div className="relative aspect-4/3 sm:aspect-video" style={{ backgroundColor: game.color + '33' }}>
            {hasResult && !showChoice && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                  {completed ? <CheckCircle2 size={15} className="text-green-500" /> : <XCircle size={15} className="text-red-400" />}
                  <span className="text-sm font-black text-gray-800">{completed ? '완료' : '실패'}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-4/3 sm:aspect-video overflow-hidden">
            <Image src={imageUrl} alt={game.name} fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover" draggable={false}
              unoptimized
              priority={priority}
              onError={() => setImgFailed(true)} />
            {hasResult && !showChoice && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
                  {completed ? <CheckCircle2 size={15} className="text-green-500" /> : <XCircle size={15} className="text-red-400" />}
                  <span className="text-sm font-black text-gray-800">{completed ? '완료' : '실패'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 컬러 텍스트 바 */}
        <div className="flex-1 flex flex-col px-3 py-2.5" style={{ backgroundColor: game.color }}>
          <div className="flex items-start justify-between gap-1">
            <p className={cn('text-sm font-black leading-tight', textPrimary)}>{game.name}</p>
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
                <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', chipBg)}>+{result.score}점</span>
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
              onClick={e => { e.stopPropagation(); setShowChoice(false) }}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white active:bg-white/40 transition-colors"
            >
              <X size={13} />
            </button>
            {game.url && (
              game.url.startsWith('/') ? (
                // 내부 게임 — 같은 탭으로 이동, 결과는 게임 페이지에서 자동 저장
                <Link href={game.url}
                  onClick={e => { e.stopPropagation(); setShowChoice(false) }}
                  className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
                >
                  <Gamepad2 size={14} />플레이하기
                </Link>
              ) : (
                <Link href={game.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => { e.stopPropagation(); setShowChoice(false) }}
                  className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
                >
                  <ExternalLink size={14} />게임하기
                </Link>
              )
            )}
            {/* 외부 게임만 결과 수동 입력 — 내부 게임은 자동 저장 */}
            {!game.url.startsWith('/') && (
              user ? (
                <button
                  onClick={e => { e.stopPropagation(); setShowChoice(false); setModalOpen(true) }}
                  className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
                >
                  {hasResult ? <Edit3 size={14} /> : <Plus size={14} />}
                  {hasResult ? '결과 수정' : '결과 입력'}
                </button>
              ) : (
                <Link href="/login"
                  onClick={e => { e.stopPropagation(); setShowChoice(false) }}
                  className="flex items-center justify-center gap-2 bg-white rounded-xl w-36 py-2.5 text-sm font-black text-gray-900 active:opacity-80 transition-opacity"
                >
                  <LogIn size={14} />로그인하여 기록
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {user && (
        <ResultModal game={game} open={modalOpen} onClose={() => setModalOpen(false)}
          existingResult={result} onSuccess={onResultChange} />
      )}
    </>
  )
}
