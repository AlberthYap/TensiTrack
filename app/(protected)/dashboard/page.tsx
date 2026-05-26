import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Calendar } from 'lucide-react'
import { LatestReading } from '@/components/features/dashboard/latest-reading'
import { QuickStats } from '@/components/features/dashboard/quick-stats'
import { WeeklyChart } from '@/components/features/dashboard/weekly-chart'
import { QuickAddButton } from '@/components/features/dashboard/quick-add-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get latest reading
  const { data: latestRecord } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single()

  // Get last 7 days records for chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weeklyRecords } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .is('deleted_at', null)
    .gte('measured_at', sevenDaysAgo.toISOString())
    .order('measured_at', { ascending: true })

  // Calculate weekly average
  const weeklyAverage = weeklyRecords && weeklyRecords.length > 0
    ? {
        systolic: Math.round(
          weeklyRecords.reduce((sum, r) => sum + r.systolic, 0) / weeklyRecords.length
        ),
        diastolic: Math.round(
          weeklyRecords.reduce((sum, r) => sum + r.diastolic, 0) / weeklyRecords.length
        ),
      }
    : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Ringkasan tekanan darah Anda
        </p>
      </div>

      {/* Latest Reading */}
      {latestRecord ? (
        <LatestReading record={latestRecord} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Belum ada data
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Mulai catat tekanan darah Anda hari ini
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <QuickStats 
        weeklyAverage={weeklyAverage}
        totalRecords={weeklyRecords?.length || 0}
      />

      {/* Weekly Chart */}
      {weeklyRecords && weeklyRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Grafik 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={weeklyRecords} />
          </CardContent>
        </Card>
      )}

      {/* Quick Add Button */}
      <QuickAddButton />
    </div>
  )
}
