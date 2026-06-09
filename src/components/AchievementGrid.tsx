'use client'

import { cn } from '@/lib/utils'
import { Achievement } from '@/lib/achievements'

export default function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked)
  const locked   = achievements.filter(a => !a.unlocked)

  return (
    <div className="flex flex-col gap-2">
      {unlocked.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {unlocked.map(a => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {locked.map(a => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
      {unlocked.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">아직 획득한 업적이 없어요</p>
      )}
    </div>
  )
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors',
      a.unlocked
        ? 'bg-white border-gray-100'
        : 'bg-gray-50 border-gray-100 opacity-50',
    )}>
      <span className={cn('text-xl shrink-0', !a.unlocked && 'grayscale')}>{a.icon}</span>
      <div className="min-w-0">
        <p className={cn('text-xs font-bold truncate', a.unlocked ? 'text-gray-900' : 'text-gray-400')}>
          {a.name}
        </p>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{a.desc}</p>
      </div>
    </div>
  )
}
