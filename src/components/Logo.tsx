import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TILE_COLORS = ['#6aaa64', '#c9b458', '#6aaa64', '#c9b458', '#6aaa64']

export default function Logo({ size = 'md', className }: LogoProps) {
  const tileSize = size === 'sm' ? 7 : size === 'lg' ? 14 : 9
  const gap = size === 'sm' ? 1.5 : size === 'lg' ? 3 : 2
  const textClass = {
    sm: 'text-base font-black tracking-tight',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-4xl font-black tracking-tighter',
  }[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Wordle-style tile grid as logo mark */}
      <div className="flex gap-0.5" style={{ gap: `${gap}px` }}>
        {TILE_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: tileSize,
              height: tileSize,
              backgroundColor: color,
              opacity: i % 2 === 0 ? 1 : 0.65,
            }}
          />
        ))}
      </div>
      <span className={cn(textClass, 'text-gray-900 leading-none')}>WORDLEDLE</span>
    </div>
  )
}
