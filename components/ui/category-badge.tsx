import {
  CATEGORY_LABELS,
  getCategoryInfo,
} from '@/lib/blood-pressure'
import { BloodPressureCategory } from '@/types/blood-pressure.types'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: BloodPressureCategory
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const CATEGORY_ICON: Record<BloodPressureCategory, string> = {
  low: '↓',
  normal: '✓',
  elevated: '↑',
  hypertension_stage_1: '⚠',
  hypertension_stage_2: '⚡',
}

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size]

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border border-white/40 shadow-sm',
        `chip-${category}`,
        sizeClass,
        className
      )}
    >
      {showIcon && (
        <span className="text-current opacity-80">
          {CATEGORY_ICON[category]}
        </span>
      )}
      {CATEGORY_LABELS[category]}
    </span>
  )
}

/**
 * Compact dot indicator (untuk inline usage di tabel, dll).
 */
export function CategoryDot({
  category,
  className,
}: {
  category: BloodPressureCategory
  className?: string
}) {
  const info = getCategoryInfo(category)
  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full', className)}
      style={{
        backgroundColor: categoryBgHex(category),
      }}
      title={info.label}
      aria-label={info.label}
    />
  )
}

function categoryBgHex(category: BloodPressureCategory): string {
  const map: Record<BloodPressureCategory, string> = {
    low: '#3b82f6',
    normal: '#10b981',
    elevated: '#eab308',
    hypertension_stage_1: '#f97316',
    hypertension_stage_2: '#ef4444',
  }
  return map[category]
}
