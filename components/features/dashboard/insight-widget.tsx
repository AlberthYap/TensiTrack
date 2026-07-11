import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import type { Insight, InsightIcon, InsightTone } from '@/lib/insights'
import { cn } from '@/lib/utils'

interface InsightWidgetProps {
  insights: Insight[]
}

const iconMap: Record<
  InsightIcon,
  ComponentType<SVGProps<SVGSVGElement> & { className?: string }>
> = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  minus: Minus,
  'check-circle': CheckCircle2,
  info: Info,
  'alert-triangle': AlertTriangle,
}

const toneStyles: Record<
  InsightTone,
  {
    container: string
    iconBg: string
    iconColor: string
    titleColor: string
  }
> = {
  positive: {
    container:
      'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    titleColor: 'text-emerald-800 dark:text-emerald-200',
  },
  neutral: {
    container:
      'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-700 dark:text-blue-300',
    titleColor: 'text-blue-800 dark:text-blue-200',
  },
  caution: {
    container:
      'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-700 dark:text-amber-300',
    titleColor: 'text-amber-800 dark:text-amber-200',
  },
  attention: {
    container:
      'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-700 dark:text-red-300',
    titleColor: 'text-red-800 dark:text-red-200',
  },
}

/**
 * Compact, mobile-first widget that surfaces the most actionable weekly insight
 * on the dashboard. Renders ONE primary insight; if more are available on the
 * Analytics page, links to it. Server-renderable (no hooks / event handlers).
 */
export function DashboardInsightWidget({ insights }: InsightWidgetProps) {
  if (insights.length === 0) return null

  const primary = insights[0]
  const hasMore = insights.length > 1
  const Icon = iconMap[primary.icon]
  const styles = toneStyles[primary.tone]

  return (
    <div
      role="status"
      className={cn(
        'rounded-xl border p-3 sm:p-4 flex items-start gap-3 transition-colors',
        styles.container
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
          styles.iconBg,
          styles.iconColor
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-sm leading-tight',
            styles.titleColor
          )}
        >
          {primary.title}
        </p>
        <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 mt-0.5">
          {primary.body}
        </p>
        {hasMore && (
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Insight lainnya di Analitik &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
