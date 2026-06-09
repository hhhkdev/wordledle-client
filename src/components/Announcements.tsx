'use client'

import { useState } from 'react'
import { Megaphone, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CURRENT_VERSION } from '@/lib/version'

type AnnouncementTag = '업데이트' | '공지' | '이벤트' | '점검'
type TabKey = 'patch' | 'notice'

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
    date: '2026-06-09',
    tag: '업데이트',
    title: 'v0.2.1 업데이트',
    content:
      '프로필 페이지 강화\n' +
      '• 활동 캘린더 — 최근 91일 잔디 히트맵으로 활동 기록 시각화\n' +
      '• 업적 시스템 — 첫 클리어·올클리어·연속 기록·꼬맨틀 마스터 등 10종\n' +
      '• 1:1 비교 — 다른 유저 프로필에서 "나와 비교" 버튼으로 총점·활동일·일평균·게임별·최근 14일 승패 비교\n' +
      '• 헤더에 일평균 점수 통계 카드 추가\n\n' +
      '친구 페이지\n' +
      '• 피드 탭 추가 — 최근 7일 친구들의 게임 결과를 날짜별로 확인\n\n' +
      '랭킹 개선\n' +
      '• 티어순 정렬 기본 적용 (일평균 점수 기준)\n' +
      '• 티어순 선택 시 카드에 일평균 점수 · 활동일 수 표시\n\n' +
      '워들들 게임\n' +
      '• 타일·키보드에 Space Mono 모노스페이스 폰트 적용\n' +
      '• 유효 단어 목록 400여 개 추가\n\n' +
      '익스텐션\n' +
      '• 결과 붙여넣기 시 해당 게임 카드에 예상 점수 즉시 표시\n' +
      '• 완료한 게임을 목록 상단으로 자동 정렬\n' +
      '• 게임 이름 DB와 동기화\n' +
      '• 텍스트박스 내용에 맞게 높이 자동 조절\n' +
      '• Enter 키로 즉시 저장\n\n' +
      'GNB\n' +
      '• 익스텐션 버튼 상시 표시 — 미설치 시 설치 안내 페이지로 이동\n' +
      '• 워들들 메뉴 제거 (상단 로고 클릭으로 접근 가능)',
  },
  {
    date: '2026-06-08',
    tag: '업데이트',
    title: `${CURRENT_VERSION} 업데이트`,
    content:
      '크롬 익스텐션 출시 🧩\n' +
      '• 워들류 게임 결과를 복사 후 붙여넣기만으로 바로 저장\n' +
      '• 오늘 플레이한 게임 현황을 패널에서 한눈에 확인\n' +
      '• 게임 사이트 바로가기 제공\n' +
      '• 현재 공식 스토어 미등록 — zip 파일로만 설치 가능\n' +
      '  (설치 방법: zip 압축 해제 → chrome://extensions → 개발자 모드 ON → 폴더 로드)\n\n' +
      '워들들 자체 게임 개선\n' +
      '• 계정당 하루 1회 플레이 제한 (다기기 동기화)\n' +
      '• 모바일 키보드 잘림 수정 — 화면 너비에 맞게 자동 조정\n' +
      '• ENTER / ⌫ 키 시각적 강조\n\n' +
      '점수 체계 조정\n' +
      '• 끝까지 시도했지만 실패 시 점수 차감 (기본 점수의 절반)\n' +
      '• 카카오 오늘의 단어 최대 시도 횟수 6→5 수정\n\n' +
      '기타\n' +
      '• 로그아웃 확인 모달 추가\n' +
      '• 로그아웃 시 게임 완료 정보 즉시 초기화',
  },
  {
    date: '2026-06-07',
    tag: '업데이트',
    title: 'v0.1.0 업데이트',
    content:
      '워들들 자체 게임\n' +
      '• 오늘의 5글자 영단어 2개를 10번 안에 맞추는 게임\n' +
      '• 단어 목록 대폭 확장 — NYT Wordle 유효 단어 전체 추가\n' +
      '• 첫 접속 시 규칙 설명 팝업 표시\n' +
      '• 헤더 "?" 버튼으로 규칙 언제든지 재확인 가능',
  },
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
    title: 'v0.0.1 점수 체계 개편 및 카카오 오늘의 단어 추가',
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

const TABS: { key: TabKey; label: string }[] = [
  { key: 'patch',  label: '패치노트' },
  { key: 'notice', label: '공지' },
]

function filterByTab(items: Announcement[], tab: TabKey) {
  return items.filter(a => tab === 'patch' ? a.tag === '업데이트' : a.tag !== '업데이트')
}

export default function Announcements() {
  const [tab, setTab] = useState<TabKey>('patch')
  const [page, setPage] = useState(0)
  const [openSet, setOpenSet] = useState<Set<number>>(new Set())

  const filtered = filterByTab(ANNOUNCEMENTS, tab)
  if (ANNOUNCEMENTS.length === 0) return null

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggle(idx: number) {
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function switchTab(t: TabKey) {
    setTab(t)
    setPage(0)
    setOpenSet(new Set())
  }

  function goToPage(p: number) {
    setPage(p)
    setOpenSet(new Set())
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
          <Megaphone size={16} className="text-gray-500" />
          공지사항
        </h2>
        <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all',
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-300 text-sm">
          항목이 없어요
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pageItems.map((a, i) => {
            const idx = page * PAGE_SIZE + i
            const open = openSet.has(idx)
            return (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggle(idx)}
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
      )}

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
