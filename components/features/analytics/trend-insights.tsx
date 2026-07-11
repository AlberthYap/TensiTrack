import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Insight, InsightIcon, InsightTone } from '@/lib/insights'
import { cn } from '@/lib/utils'

interface TrendInsightsProps {
  insights: Insight[]
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

const iconMap: Record<InsightIcon, IconComponent> = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'minus': Minus,
  'check-circle': CheckCircle2,
  info: Info,
  'alert-triangle': AlertTriangle,
}

const toneConfig: Record<
  InsightTone,
  {
    badge: string
    container: string
    iconBg: string
    iconColor: string
    titleColor: string
    badgeColor: string
  }
> = {
  positive: {
    badge: 'Positif',
    container:
      'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    titleColor: 'text-emerald-800 dark:text-emerald-200',
    badgeColor:
      'bg-emerald-200/70 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  neutral: {
    badge: 'Info',
    container:
      'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-700 dark:text-blue-300',
    titleColor: 'text-blue-800 dark:text-blue-200',
    badgeColor:
      'bg-blue-200/70 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  },
  caution: {
    badge: 'Perhatian',
    container:
      'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-700 dark:text-amber-300',
    titleColor: 'text-amber-800 dark:text-amber-200',
    badgeColor:
      'bg-amber-200/70 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  },
  attention: {
    badge: 'Penting',
    container:
      'bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/50',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-700 dark:text-red-300',
    titleColor: 'text-red-800 dark:text-red-200',
    badgeColor:
      'bg-red-200/70 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  },
}

export function TrendInsights({ insights }: TrendInsightsProps) {
  if (insights.length === 0) return null

  return (
    <Card className="overflow-hidden animate-fade-in-up">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-amber-50/40 to-orange-50/40 dark:from-amber-950/15 dark:to-orange-950/15">
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-warm shadow-md">
            <Lightbulb className="w-4 h-4 text-white" />
          </span>
          <span>
            Insight Otomatis
            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
              Interpretasi tren tekanan darah Anda minggu ini
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-3">
        {insights.map((insight) => {
          const Icon = iconMap[insight.icon]
          const styles = toneConfig[insight.tone]
          return (
            <div
              key={insight.id}
              role="status"
              className={cn(
                'flex items-start gap-3 sm:gap-4 p-4 rounded-xl border',
                styles.container
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'inline-flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
                  styles.iconBg,
                  styles.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3
                    className={cn('font-semibold text-sm', styles.titleColor)}
                  >
                    {insight.title}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
                      styles.badgeColor
                    )}
                  >
                    {styles.badge}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {insight.body}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
