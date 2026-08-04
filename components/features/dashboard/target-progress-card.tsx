import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TargetProgressCardProps {
  targetSystolic: number | null
  targetDiastolic: number | null
  weeklyAverage: { systolic: number; diastolic: number } | null
}

function getProgressColor(current: number, target: number): string {
  const diff = current - target
  if (diff <= -5) return 'text-emerald-600 dark:text-emerald-400'
  if (diff <= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getProgressBarColor(current: number, target: number): string {
  const diff = current - target
  if (diff <= -5) return 'from-emerald-500 to-green-500'
  if (diff <= 5) return 'from-amber-500 to-yellow-500'
  return 'from-red-500 to-rose-500'
}

/**
 * Compact card showing how the weekly average compares to the user's target BP.
 * Progress bar: 0% at 0, 100% at target, clamps to 120% for above-target values.
 */
export function TargetProgressCard({
  targetSystolic,
  targetDiastolic,
  weeklyAverage,
}: TargetProgressCardProps) {
  if (!targetSystolic || !targetDiastolic || !weeklyAverage) return null

  const sysDiff = weeklyAverage.systolic - targetSystolic
  const diaDiff = weeklyAverage.diastolic - targetDiastolic

  // Progress: what % of target the current value is (clamped 0–120%)
  const sysPct = Math.min(120, Math.max(0, (weeklyAverage.systolic / targetSystolic) * 100))
  const diaPct = Math.min(120, Math.max(0, (weeklyAverage.diastolic / targetDiastolic) * 100))

  // Target marker: where the 100% target line sits on the filled bar
  const sysMarkerPct = Math.min(100, (targetSystolic / weeklyAverage.systolic) * 100)
  const diaMarkerPct = Math.min(100, (targetDiastolic / weeklyAverage.diastolic) * 100)

  const sysColor = getProgressColor(weeklyAverage.systolic, targetSystolic)
  const diaColor = getProgressColor(weeklyAverage.diastolic, targetDiastolic)
  const sysBarColor = getProgressBarColor(weeklyAverage.systolic, targetSystolic)
  const diaBarColor = getProgressBarColor(weeklyAverage.diastolic, targetDiastolic)

  return (
    <Card className="overflow-hidden">
      <div className={cn('h-1 bg-gradient-to-r', sysBarColor)} />
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Target className="w-4 h-4 text-white" />
          </span>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Target vs Rata-rata Mingguan
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Target: <span className="font-bold">{targetSystolic}/{targetDiastolic} mmHg</span>
            </p>
          </div>
        </div>

        {/* Systolic bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Sistolik</span>
            <span className={cn('font-semibold', sysColor)}>
              {weeklyAverage.systolic} mmHg
              {sysDiff !== 0 && (
                <span className="ml-1 font-normal">
                  ({sysDiff > 0 ? '+' : ''}{sysDiff})
                </span>
              )}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', sysBarColor)}
              style={{ width: `${sysPct}%` }}
            />
            {/* Target line marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-gray-300 z-10"
              style={{ left: `${sysMarkerPct}%` }}
            />
          </div>
        </div>

        {/* Diastolic bar */}
        <div className="space-y-1.5 mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Diastolik</span>
            <span className={cn('font-semibold', diaColor)}>
              {weeklyAverage.diastolic} mmHg
              {diaDiff !== 0 && (
                <span className="ml-1 font-normal">
                  ({diaDiff > 0 ? '+' : ''}{diaDiff})
                </span>
              )}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', diaBarColor)}
              style={{ width: `${diaPct}%` }}
            />
            {/* Target line marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-gray-300 z-10"
              style={{ left: `${diaMarkerPct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
