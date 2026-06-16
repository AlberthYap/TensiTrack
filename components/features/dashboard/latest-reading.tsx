import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryBadge } from '@/components/ui/category-badge'
import { Activity, Clock, Heart, MessageSquare } from 'lucide-react'
import { formatBloodPressure } from '@/lib/blood-pressure'
import { formatRelativeTime } from '@/lib/date'

interface LatestReadingProps {
  record: BloodPressureRecord
}

export function LatestReading({ record }: LatestReadingProps) {
  return (
    <Card className="overflow-hidden relative animate-scale-in">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
              <p className="text-5xl md:text-6xl font-bold text-gradient tracking-tight">
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
  )
}
