import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Heart, Sparkles } from 'lucide-react'
import { LatestReading } from '@/components/features/dashboard/latest-reading'
import { QuickStats } from '@/components/features/dashboard/quick-stats'
import { WeeklyChart } from '@/components/features/dashboard/weekly-chart'
import { QuickAddButton } from '@/components/features/dashboard/quick-add-button'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Get latest reading (filtered by user_id for defense-in-depth, walaupun
  // RLS sudah menjamin isolasi)
  const { data: latestRecord } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get last 7 days records for chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weeklyRecords } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
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
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <p className="text-xs font-semibold text-gradient uppercase tracking-wider">
            Ringkasan Kesehatan
          </p>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Pantau tekanan darah Anda dalam 7 hari terakhir
        </p>
      </div>

      {/* Latest Reading or Empty State */}
      {latestRecord ? (
        <LatestReading record={latestRecord} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Heart}
              gradient="hero"
              title="Belum ada pencatatan"
              description="Mulai catat tekanan darah pertama Anda hari ini untuk mulai memantau kesehatan."
              action={
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/records/new">Catat Sekarang</Link>
                </Button>
              }
            />
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
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/50">
                <Calendar className="w-4 h-4 text-white" />
              </span>
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
