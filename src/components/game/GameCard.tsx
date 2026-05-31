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

  return (
    <>
      {/*
       * 카드 비율: aspect-[4/3] — 가로:세로 = 4:3
       * 배경 이미지 권장: 800×600px (4:3, 2x 레티나 기준)
       * 안전 영역: 이미지 상단 40% (하단 60%는 콘텐츠 오버레이로 가려짐)
       * 로고/브랜딩은 이미지 상단 중앙에 배치 권장
       */}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 aspect-4/3"
      >
        {/* 배경: 이미지 or 단색 */}
        {game.image_url ? (
          <>
            <img
              src={game.image_url}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/45" />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ backgroundColor: game.color }} />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10" />
          </>
        )}

        {/* 완료 뱃지 */}
        {hasResult && (
          <div className="absolute top-2 right-2 z-10">
            {completed ? (
              <div className="flex items-center gap-0.5 bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} className="text-white" />
                <span className="text-xs font-bold text-white">완료</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <XCircle size={11} className="text-white/80" />
                <span className="text-xs font-semibold text-white/80">실패</span>
              </div>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="relative z-10 flex flex-col flex-1 p-3 sm:p-4 gap-1">
          {/* 상단: 이모지 */}
          <div className="text-2xl sm:text-3xl leading-none">{game.emoji}</div>

          {/* 게임명 + 설명 */}
          <div className="mt-0.5">
            <h3 className="text-sm sm:text-base font-black text-white leading-tight tracking-tight">
              {game.name}
            </h3>
            <p className="text-xs text-white/70 font-medium mt-0.5 line-clamp-1">{game.description}</p>
          </div>

          {/* 결과 stats */}
          {hasResult && result && <ResultStats game={game} result={result} />}

          <div className="flex-1" />

          {/* 버튼 영역 */}
          <div className="flex items-center gap-1.5">
            <Link
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
            >
              <ExternalLink size={12} />
              <span className="hidden xs:inline">게임하기</span>
              <span className="xs:hidden">이동</span>
            </Link>

            {user && (
              <button
                onClick={() => setModalOpen(true)}
                className={cn(
                  'flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
                  hasResult
                    ? 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm'
                    : 'bg-white text-gray-900 hover:bg-white/90'
                )}
              >
                {hasResult ? <Edit3 size={12} /> : <Plus size={12} />}
                <span className="hidden sm:inline">{hasResult ? '수정' : '결과 입력'}</span>
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
