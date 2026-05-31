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

// ── 여기에 공지사항을 추가하세요 (최신 순) ──────────────────────
const ANNOUNCEMENTS: Announcement[] = [
  {
    date: '2026-06-01',
    tag: '업데이트',
    title: '서비스 오픈 🎉',
    content: 'Wordle · 꼬들 · 꼬오오오오들 · 꼬맨틀 4가지 게임으로 서비스가 시작되었습니다. 친구를 초대해 랭킹을 겨뤄보세요!',
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
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{a.content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
