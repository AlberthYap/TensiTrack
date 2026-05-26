import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock } from 'lucide-react'
import { getCategoryInfo, formatBloodPressure } from '@/lib/blood-pressure'
import { formatRelativeTime } from '@/lib/date'
import { cn } from '@/lib/utils'

interface LatestReadingProps {
  record: BloodPressureRecord
}

export function LatestReading({ record }: LatestReadingProps) {
  const categoryInfo = getCategoryInfo(record.category)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Pembacaan Terakhir
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Blood Pressure Reading */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatBloodPressure(record.systolic, record.diastolic)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                mmHg
              </p>
            </div>
            <Badge className={cn('text-sm px-3 py-1', categoryInfo.bgColor, categoryInfo.color)}>
              {categoryInfo.label}
            </Badge>
          </div>

          {/* Pulse */}
          {record.pulse && (
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Denyut Nadi: <strong>{record.pulse} bpm</strong>
              </span>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            {formatRelativeTime(record.measured_at)}
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {record.notes}
              </p>
            </div>
          )}

          {/* Category Description */}
          <div className={cn('p-3 rounded-lg text-sm', categoryInfo.bgColor)}>
            <p className={categoryInfo.color}>
              {categoryInfo.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
