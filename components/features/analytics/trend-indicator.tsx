import { TrendComparison } from '@/types/blood-pressure.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  Calendar,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface TrendIndicatorProps {
  comparison: TrendComparison
  periodDays: number
  /** Skin kartu. Default: kartu Analytics standar. Glass: chrome share-page. */
  variant?: 'default' | 'glass'
}

function TrendBody({
  comparison,
  periodDays,
}: {
  comparison: TrendComparison
  periodDays: number
}) {
  const { current, previous, systolicChange, diastolicChange } = comparison
  const hasCurrent = current.readingCount > 0
  const hasPrevious = previous.readingCount > 0

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formatPeriod(current.startDate, current.endDate)} vs{' '}
        {formatPeriod(previous.startDate, previous.endDate)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TrendCard
          label="Sistolik"
          change={systolicChange}
          current={current.averageSystolic}
          previous={previous.averageSystolic}
          color="red"
        />
        <TrendCard
          label="Diastolik"
          change={diastolicChange}
          current={current.averageDiastolic}
          previous={previous.averageDiastolic}
          color="blue"
        />
      </div>

      {!hasCurrent && !hasPrevious && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada data untuk dibandingkan.
        </p>
      )}
      {!hasPrevious && hasCurrent && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Tidak ada data pada periode sebelumnya untuk dibandingkan.
        </p>
      )}
    </div>
  )
}

export function TrendIndicator({
  comparison,
  periodDays,
  variant = 'default',
}: TrendIndicatorProps) {
  if (variant === 'glass') {
    return (
      <section className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 overflow-hidden">
        <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-white/40 dark:border-white/5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-violet-600 dark:text-violet-400">
              <Eye className="w-3 h-3" />
              Dilihat via link berbagi
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Tren {periodDays} Hari
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Perbandingan dengan {periodDays} hari sebelumnya
            </p>
          </div>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
            <GitCompare className="w-4 h-4 text-white" />
          </span>
        </header>
        <div className="p-5 sm:p-6">
          <TrendBody comparison={comparison} periodDays={periodDays} />
        </div>
      </section>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Tren {periodDays} Hari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TrendBody comparison={comparison} periodDays={periodDays} />
      </CardContent>
    </Card>
  )
}

interface TrendCardProps {
  label: string
  change: number
  current: number
  previous: number
  color: 'red' | 'blue'
}

function TrendCard({ label, change, current, previous, color }: TrendCardProps) {
  const { icon: Icon, className, suffix } = getTrendDisplay(change, color)

  return (
    <div
      className={`p-4 rounded-lg border ${className.border} ${className.bg}`}
    >
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold tabular-nums ${className.text}`}>
          {current > 0 ? current : '-'}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400">mmHg</span>
      </div>
      <div
        className={`mt-2 flex items-center gap-1 text-xs ${className.text}`}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium tabular-nums">
          {change > 0 ? '+' : ''}
          {change}
        </span>
        <span className="text-gray-500 dark:text-gray-400">mmHg {suffix}</span>
      </div>
      {previous > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Sebelumnya: {previous} mmHg
        </p>
      )}
    </div>
  )
}

function getTrendDisplay(change: number, color: 'red' | 'blue') {
  if (Math.abs(change) < 3) {
    return {
      icon: Minus,
      suffix: 'stabil',
      className: {
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
      },
    }
  }

  const isUp = change > 0
  const palette =
    color === 'red'
      ? {
          upText: 'text-red-700 dark:text-red-300',
          downText: 'text-green-700 dark:text-green-300',
        }
      : {
          upText: 'text-blue-700 dark:text-blue-300',
          downText: 'text-green-700 dark:text-green-300',
        }

  if (isUp) {
    return {
      icon: TrendingUp,
      suffix: 'naik',
      className: {
        text: palette.upText,
        border: 'border-red-200 dark:border-red-900',
        bg: 'bg-red-50 dark:bg-red-950/30',
      },
    }
  }

  return {
    icon: TrendingDown,
    suffix: 'turun',
    className: {
      text: palette.downText,
      border: 'border-green-200 dark:border-green-900',
      bg: 'bg-green-50 dark:bg-green-950/30',
    },
  }
}

function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return `${format(start, 'd MMM', { locale: id })} - ${format(end, 'd MMM yyyy', { locale: id })}`
}
