'use client'

import { useState } from 'react'
import { Megaphone, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type AnnouncementTag = '업데이트' | '공지' | '이벤트' | '점검'

interface Announcement {
  date: string
  tag: AnnouncementTag
  title: string
  content: string
}

const TAG_STYLES: Record<AnnouncementTag, string> = {
  업데이트: 'bg-blue-100 text-blue-700',
  공지:     'bg-gray-100 text-gray-700',
  이벤트:   'bg-yellow-100 text-yellow-700',
  점검:     'bg-red-100 text-red-700',
}

// ── 공지사항 목록 (최신 순으로 추가) ────────────────────────────
const ANNOUNCEMENTS: Announcement[] = [
  {
    date: '2026-06-06',
    tag: '업데이트',
    title: 'v0.0.3 업데이트',
    content:
      '게임 추가\n' +
      '• Word Hurdle 4-letter / 5-letter / 6-letter 추가\n\n' +
      '카카오 오늘의 단어\n' +
      '• "N번째 정답자" 결과 포맷 지원\n' +
      '• 빠른 풀이 보너스 +5점 추가\n\n' +
      '유저 프로필\n' +
      '• 유저별 공개 프로필 페이지 추가 (/users/닉네임)\n' +
      '• 게임별 누적 통계 및 최근 30일 기록 조회\n' +
      '• 친구 추가/삭제 버튼\n' +
      '• 닉네임 인라인 편집\n\n' +
      '랭킹\n' +
      '• 홈 랭킹 위젯에 오늘/어제 탭 추가\n' +
      '• 랭킹 기본 정렬을 점수순으로 변경\n' +
      '• 랭킹에서 유저 클릭 시 프로필 페이지로 이동\n\n' +
      '기타\n' +
      '• 게임 카드 이미지 적용\n' +
      '• 게임 카드 선택 오버레이 UI 개선',
  },
  {
    date: '2026-06-06',
    tag: '공지',
    title: '기록 데이터 초기화 안내',
    content:
      '서버 작업 중 오류로 인해 기존에 입력하신 게임 결과 데이터가 초기화되었습니다.\n\n' +
      '복구를 시도하였으나 안타깝게도 복구에 실패하였습니다.\n\n' +
      '불편을 드려 진심으로 죄송합니다.',
  },
  {
    date: '2026-06-02',
    tag: '업데이트',
    title: 'v0.0.2 업데이트',
    content:
      '홈 화면 개선\n' +
      '• 최근 24시간 랭킹 위젯 추가\n' +
      '• 로그인 유도 배너 제거 — 게임 카드에서 바로 로그인/기록 가능\n' +
      '• 게임 카드에 화살표 아이콘 추가 및 선택 오버레이 가시성 개선\n\n' +
      '랭킹 페이지\n' +
      '• 필터 UI 전면 개편\n\n' +
      '마이페이지\n' +
      '• 게임별 통계 카드 접기/펼치기 디자인 개선\n\n' +
      '공지사항\n' +
      '• 항목 접기/펼치기 및 페이지네이션 적용',
  },
  {
    date: '2026-06-01',
    tag: '업데이트',
    title: '점수 체계 개편 및 카카오 오늘의 단어 추가',
    content:
      '게임별 난이도에 따라 점수 체계가 개편되었습니다.\n\n' +
      '• Wordle / 꼬들: 클리어 10점 + 절약한 시도 수당 1점 (최대 15점)\n' +
      '• 꼬오오오오들: 클리어 20점 + 절약한 시도 수당 1점 (최대 25점)\n' +
      '• 꼬맨틀: 클리어 20점 (시도 무제한으로 보너스 없음)\n\n' +
      '전체 최대 점수는 75점입니다.\n\n' +
      '카카오 오늘의 단어가 새로운 게임으로 추가되었습니다. ' +
      '카카오톡 미니게임으로만 플레이 가능하며, 결과 텍스트를 붙여넣어 기록할 수 있어요.',
  },
  {
    date: '2026-06-01',
    tag: '공지',
    title: '⚠️ v1.0.0 이전 데이터 초기화 안내',
    content:
      '현재 서비스는 초기 개발 단계(v0.0.1)입니다.\n' +
      'v1.0.0 정식 출시 전까지 데이터베이스 구조 변경으로 인해 ' +
      '기록, 계정 등 저장된 데이터가 예고 없이 초기화될 수 있습니다.\n' +
      '불편하시더라도 양해 부탁드립니다.',
  },
  {
    date: '2026-06-01',
    tag: '업데이트',
    title: 'v0.0.1 첫 출시',
    content:
      'WORDLEDLE이 처음으로 공개되었습니다!\n' +
      '지원 게임: Wordle · 꼬들 · 꼬오오오오들 · 꼬맨틀\n' +
      '게임 결과를 붙여넣어 기록하고, 친구들과 랭킹을 겨뤄보세요. ' +
      '불편한 점은 하단 피드백 버튼으로 알려주세요.',
  },
]
const PAGE_SIZE = 3
// ────────────────────────────────────────────────────────────────

export default function Announcements() {
  const [page, setPage] = useState(0)
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  if (ANNOUNCEMENTS.length === 0) return null

  const totalPages = Math.ceil(ANNOUNCEMENTS.length / PAGE_SIZE)
  const pageItems = ANNOUNCEMENTS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggle(globalIdx: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(globalIdx) ? next.delete(globalIdx) : next.add(globalIdx)
      return next
    })
  }

  function goToPage(p: number) {
    setPage(p)
    setOpenSet(new Set()) // 페이지 이동 시 모두 닫기
  }

  return (
    <section className="mt-10">
      <h2 className="text-base font-black text-gray-900 flex items-center gap-2 mb-3">
        <Megaphone size={16} className="text-gray-500" />
        공지사항
      </h2>

      <div className="flex flex-col gap-2">
        {pageItems.map((a, i) => {
          const globalIdx = page * PAGE_SIZE + i
          const open = openSet.has(globalIdx)

          return (
            <div key={globalIdx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggle(globalIdx)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full shrink-0', TAG_STYLES[a.tag])}>
                      {a.tag}
                    </span>
                    <time className="text-xs text-gray-400">{a.date}</time>
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">{a.title}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn('text-gray-300 shrink-0 transition-transform duration-200', open && 'rotate-180')}
                />
              </button>

              {open && (
                <div className="px-4 pb-4 pt-3 border-t border-gray-50">
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{a.content}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-xs font-semibold text-gray-400 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200"
          >
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      )}
    </section>
  )
}
