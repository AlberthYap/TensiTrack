import { TrendComparison } from '@/app/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface TrendIndicatorProps {
  comparison: TrendComparison
  periodDays: number
}

export function TrendIndicator({
  comparison,
  periodDays,
}: TrendIndicatorProps) {
  const { current, previous, systolicChange, diastolicChange } = comparison

  const hasCurrent = current.readingCount > 0
  const hasPrevious = previous.readingCount > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          Tren {periodDays} Hari
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
