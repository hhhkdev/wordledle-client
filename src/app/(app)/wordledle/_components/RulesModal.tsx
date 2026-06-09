import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TILE_COLORS } from './constants'

const EXAMPLE = [
  { letter: 'W', state: 'correct' },
  { letter: 'E', state: 'absent' },
  { letter: 'A', state: 'present' },
  { letter: 'R', state: 'absent' },
  { letter: 'Y', state: 'absent' },
] as const

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative overflow-y-auto max-h-[90dvh]">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <X size={16} />
        </button>

        <h2 className="text-xl font-black text-gray-900 mb-1">워들들 규칙</h2>
        <p className="text-sm text-gray-500 mb-5">오늘의 5글자 영단어 2개를 맞혀보세요</p>

        <ul className="text-sm text-gray-700 space-y-2 mb-5">
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">①</span>단어 1을 먼저 맞춰야 단어 2로 넘어갑니다.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">②</span>두 단어를 합쳐 총 <strong>10번</strong> 안에 맞춰야 합니다.</li>
          <li className="flex gap-2"><span className="text-gray-400 shrink-0">③</span>기본 10점 + 남은 시도 수만큼 보너스 점수!</li>
        </ul>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">타일 색상 의미</p>
          <div className="flex gap-1.5 mb-3">
            {EXAMPLE.map(({ letter, state }) => (
              <div key={letter} className={cn(
                'w-10 h-10 border-2 flex items-center justify-center font-game',
                'text-base font-black uppercase rounded-lg',
                TILE_COLORS[state],
              )}>{letter}</div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500 shrink-0" />
              <span className="text-gray-700"><strong>W</strong>: 정확한 위치에 있는 글자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-400 shrink-0" />
              <span className="text-gray-700"><strong>A</strong>: 단어에 있지만 위치가 다른 글자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-500 shrink-0" />
              <span className="text-gray-700"><strong>E R Y</strong>: 단어에 없는 글자</span>
            </div>
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-black active:opacity-80 transition-opacity">
          게임 시작!
        </button>
      </div>
    </div>
  )
}
