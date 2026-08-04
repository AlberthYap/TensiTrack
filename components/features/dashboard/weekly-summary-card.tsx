import { Card, CardContent } from '@/components/ui/card'
import { Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BloodPressureRecord } from '@/types/blood-pressure.types'

interface WeeklySummaryCardProps {
  weeklyAverage: { systolic: number; diastolic: number } | null
  recordCount: number
  records: BloodPressureRecord[]
}

const CATEGORY_LABELS: Record<string, string> = {
  low: 'Rendah',
  normal: 'Normal',
  elevated: 'Meningkat',
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  low: 'from-slate-500 to-gray-500',
  normal: 'from-emerald-500 to-green-500',
  elevated: 'from-amber-500 to-yellow-500',
  hypertension_stage_1: 'from-orange-500 to-red-500',
  hypertension_stage_2: 'from-red-500 to-rose-500',
}

/**
 * Compact weekly summary card for the dashboard.
 * Shows average BP, reading count, and dominant category for the week.
 */
export function WeeklySummaryCard({
  weeklyAverage,
  recordCount,
  records,
}: WeeklySummaryCardProps) {
  if (!weeklyAverage || recordCount === 0) return null

  // Find dominant category
  const categoryCounts: Record<string, number> = {}
  for (const r of records) {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1
  }
  let dominant = 'normal'
  let maxCount = 0
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count
      dominant = cat
    }
  }
  const dominantPct = Math.round((maxCount / recordCount) * 100)
  const gradient = CATEGORY_GRADIENTS[dominant] || CATEGORY_GRADIENTS.normal

  return (
    <Card className="overflow-hidden">
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ringkasan Minggu Ini
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {weeklyAverage.systolic}/{weeklyAverage.diastolic}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  mmHg
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {recordCount}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                Pengukuran
              </p>
            </div>
            <div className="text-center">
              <p
                className={cn(
                  'text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  gradient
                )}
              >
                {dominantPct}%
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                {CATEGORY_LABELS[dominant]}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
