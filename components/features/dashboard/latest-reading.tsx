import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/ui/category-badge'
import { CrisisAlert } from '@/components/features/emergency/crisis-alert'
import { Activity, Clock, Heart, MessageSquare } from 'lucide-react'
import {
  formatBloodPressure,
  isHypertensionCrisis,
} from '@/lib/blood-pressure'
import { formatRelativeTime } from '@/lib/date'
import { cn } from '@/lib/utils'

interface LatestReadingProps {
  record: BloodPressureRecord
}

export function LatestReading({ record }: LatestReadingProps) {
  const isCrisis = isHypertensionCrisis(record.systolic, record.diastolic)

  return (
    <div className="space-y-3">
      {/* Crisis alert takes priority — show ABOVE the reading card */}
      {isCrisis && (
        <CrisisAlert
          systolic={record.systolic}
          diastolic={record.diastolic}
          variant="banner"
        />
      )}

      <Card
        className={cn(
          'overflow-hidden relative animate-scale-in',
          isCrisis && 'ring-2 ring-red-600 border-red-600'
        )}
      >
        {/* Decorative gradient background — switches to red when crisis */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            isCrisis
              ? 'bg-gradient-to-br from-red-50/80 via-red-50/50 to-orange-50/60 dark:from-red-950/40 dark:via-red-950/30 dark:to-orange-950/30'
              : 'bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20'
          )}
        />
        <div
          className={cn(
            'absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none',
            isCrisis
              ? 'bg-gradient-to-br from-red-400/30 to-orange-400/20'
              : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20'
          )}
        />

        <div className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span
                  className={cn(
                    'p-1.5 rounded-lg',
                    isCrisis
                      ? 'bg-red-100 dark:bg-red-950'
                      : 'bg-blue-100 dark:bg-blue-950'
                  )}
                >
                  <Activity
                    className={cn(
                      'w-4 h-4',
                      isCrisis
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    )}
                  />
                </span>
                Pembacaan Terakhir
              </CardTitle>
              <CategoryBadge category={record.category} size="md" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Big BP Reading */}
              <div className="flex items-end gap-3 flex-wrap">
                <p
                  className={cn(
                    'text-5xl md:text-6xl font-bold tracking-tight',
                    isCrisis
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-gradient'
                  )}
                >
                  {formatBloodPressure(record.systolic, record.diastolic)}
                </p>
                <span className="text-base text-gray-500 dark:text-gray-400 mb-2">
                  mmHg
                </span>
              </div>

              {/* Pulse + Time row */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm">
                {record.pulse && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="font-semibold">{record.pulse}</span>
                    <span className="text-xs opacity-80">bpm</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(record.measured_at)}
                </div>
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <p className="italic">&ldquo;{record.notes}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
