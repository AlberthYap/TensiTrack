import { MonthlyStats } from '@/app/actions/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, TrendingUp, TrendingDown, Activity, Heart } from 'lucide-react'
import { formatBloodPressure } from '@/lib/blood-pressure'

interface MonthlyStatsCardProps {
  stats: MonthlyStats | null
}

export function MonthlyStatsCard({ stats }: MonthlyStatsCardProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Statistik Bulan Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Belum ada data untuk bulan ini.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Statistik {stats.monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatTile
            icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            label="Rata-rata Tekanan Darah"
            value={formatBloodPressure(
              stats.averageSystolic,
              stats.averageDiastolic
            )}
            suffix="mmHg"
          />
          <StatTile
            icon={<Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            label="Rata-rata Nadi"
            value={stats.averagePulse !== null ? String(stats.averagePulse) : '-'}
            suffix={stats.averagePulse !== null ? 'bpm' : ''}
          />
          <StatTile
            icon={<Activity className="w-5 h-5 text-green-600 dark:text-green-400" />}
            label="Jumlah Pencatatan"
            value={String(stats.totalReadings)}
            suffix={`${stats.daysTracked} hari`}
          />
          <StatTile
            icon={
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
            }
            label="Sistolik Tertinggi"
            value={String(stats.highestSystolic)}
            suffix="mmHg"
          />
          <StatTile
            icon={
              <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            }
            label="Sistolik Terendah"
            value={String(stats.lowestSystolic)}
            suffix="mmHg"
          />
          <StatTile
            icon={
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                DIA
              </span>
            }
            label="Rentang Diastolik"
            value={`${stats.lowestDiastolic} - ${stats.highestDiastolic}`}
            suffix="mmHg"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: string
  suffix?: string
}

function StatTile({ icon, label, value, suffix }: StatTileProps) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}
