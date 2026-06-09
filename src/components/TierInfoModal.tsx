'use client'

import { X } from 'lucide-react'
import { TIERS, UNRATED, type Tier } from '@/lib/tiers'
import TierBadge from '@/components/TierBadge'

interface TierGroup {
  representative: Tier  // 대표 배지로 보여줄 티어 (III 서브)
  label: string
  range: string
  detail: string        // 서브티어 범위 설명
}

// 각 주요 티어의 대표 배지 (III = 중간 서브)
function getTierRep(name: string, sub: number): Tier {
  return TIERS.find(t => t.name === name && t.sub === sub) ?? UNRATED
}

const TIER_GROUPS: TierGroup[] = [
  {
    representative: TIERS[0], // master
    label: '마스터',
    range: '160점 이상',
    detail: '9개 게임 모두 매일 최고 점수',
  },
  {
    representative: getTierRep('ruby', 3),
    label: '루비',
    range: '135 ~ 159점',
    detail: '전 게임 거의 완벽한 플레이',
  },
  {
    representative: getTierRep('diamond', 3),
    label: '다이아',
    range: '114 ~ 134점',
    detail: '8개 게임 고득점 유지',
  },
  {
    representative: getTierRep('platinum', 3),
    label: '플래티넘',
    range: '90 ~ 113점',
    detail: '7~8개 게임 꾸준히 참여',
  },
  {
    representative: getTierRep('gold', 3),
    label: '골드',
    range: '60 ~ 89점',
    detail: '5~6개 게임 참여',
  },
  {
    representative: getTierRep('silver', 3),
    label: '실버',
    range: '18 ~ 59점',
    detail: '3~4개 게임 참여',
  },
  {
    representative: getTierRep('bronze', 3),
    label: '브론즈',
    range: '17점 이하',
    detail: '1~2개 게임 참여',
  },
  {
    representative: UNRATED,
    label: '언레이티드',
    range: '—',
    detail: '활동 기록 7일 미만',
  },
]

interface TierInfoModalProps {
  open: boolean
  onClose: () => void
  currentTier?: Tier
}

export default function TierInfoModal({ open, onClose, currentTier }: TierInfoModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900">티어 시스템</h2>
            <p className="text-xs text-gray-400 mt-0.5">일평균 점수 기준 · 최소 7일 활동 필요</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 티어 목록 */}
        <div className="px-5 py-4 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto">
          {TIER_GROUPS.map(group => {
            const isCurrentTier = currentTier && group.representative.name === currentTier.name
            return (
              <div
                key={group.label}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  isCurrentTier ? 'bg-gray-50 ring-1 ring-gray-200' : ''
                }`}
              >
                <TierBadge tier={group.representative} size="sm" className="w-24 justify-center shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{group.label}</span>
                    {isCurrentTier && (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">현재</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{group.detail}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 shrink-0 tabular-nums">{group.range}</span>
              </div>
            )
          })}
        </div>

        {/* 설명 */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-1.5">
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">서브티어</span>: 각 티어 내 I(최고) ~ V(최저) 5단계
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">계산 방식</span>: 날짜별 합산 점수의 전체 평균
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">일 최대 점수</span>: 약 160점 (9개 게임 전부 1시도 클리어)
          </p>
        </div>
      </div>
    </div>
  )
}
