import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Calendar, Activity } from 'lucide-react'
import { formatBloodPressure } from '@/lib/blood-pressure'

interface QuickStatsProps {
  weeklyAverage: {
    systolic: number
    diastolic: number
  } | null
  totalRecords: number
}

export function QuickStats({ weeklyAverage, totalRecords }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Weekly Average */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rata-rata 7 Hari
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyAverage
                  ? formatBloodPressure(weeklyAverage.systolic, weeklyAverage.diastolic)
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Records This Week */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pencatatan 7 Hari
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecords}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecords > 0 ? 'Aktif' : 'Belum Ada'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
