import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  gradient?: 'hero' | 'cool' | 'warm' | 'success' | 'purple' | 'pink'
  className?: string
}

const GRADIENT_MAP = {
  hero: 'bg-gray-100 dark:bg-gray-800',
  cool: 'bg-gray-100 dark:bg-gray-800',
  warm: 'bg-gray-100 dark:bg-gray-800',
  success: 'bg-gray-100 dark:bg-gray-800',
  purple: 'bg-gray-100 dark:bg-gray-800',
  pink: 'bg-gray-100 dark:bg-gray-800',
} as const

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  gradient = 'hero',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'text-center py-12 px-4 animate-fade-in-up',
        className
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
          GRADIENT_MAP[gradient]
        )}
      >
        <Icon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
