import { Megaphone } from 'lucide-react'
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
    title: 'v0.0.1 첫 출시 🎉',
    content:
      'WORDLEDLE이 처음으로 공개되었습니다!\n' +
      '지원 게임: Wordle · 꼬들 · 꼬오오오오들 · 꼬맨틀\n' +
      '게임 결과를 붙여넣어 기록하고, 친구들과 랭킹을 겨뤄보세요. ' +
      '불편한 점은 하단 피드백 버튼으로 알려주세요.',
  },
]
// ────────────────────────────────────────────────────────────────

export default function Announcements() {
  if (ANNOUNCEMENTS.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-base font-black text-gray-900 flex items-center gap-2 mb-3">
        <Megaphone size={16} className="text-gray-500" />
        공지사항
      </h2>
      <div className="flex flex-col gap-2">
        {ANNOUNCEMENTS.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', TAG_STYLES[a.tag])}>
                {a.tag}
              </span>
              <time className="text-xs text-gray-400">{a.date}</time>
            </div>
            <p className="text-sm font-bold text-gray-900">{a.title}</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed whitespace-pre-line">{a.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
