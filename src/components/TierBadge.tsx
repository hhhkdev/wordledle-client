import { getTierLabel, type Tier } from '@/lib/tiers'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  tier: Tier
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const SIZE = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-md',
  sm: 'text-xs px-2.5 py-1 rounded-lg',
  md: 'text-sm px-3 py-1.5 rounded-xl',
}

export default function TierBadge({ tier, size = 'sm', className }: TierBadgeProps) {
  const label = getTierLabel(tier)
  const isMaster = tier.name === 'master'

  return (
    <span
      className={cn('inline-flex items-center font-black tracking-tight whitespace-nowrap', SIZE[size], className)}
      style={
        isMaster
          ? { background: 'linear-gradient(135deg,#a855f7,#ec4899,#f59e0b)', color: '#fff' }
          : { backgroundColor: tier.color, color: tier.textColor }
      }
    >
      {label}
    </span>
  )
}
