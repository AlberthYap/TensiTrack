import { createClient } from '@/lib/supabase/server'
import { getWeeklyRecords } from '@/lib/dashboard-queries'
import { WeeklySummaryCard } from './weekly-summary-card'
import { TargetProgressCard } from './target-progress-card'
import { QuickStats } from './quick-stats'
import { WeeklyChart } from './weekly-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import type { BloodPressureRecord } from '@/types/blood-pressure.types'

interface WeeklySectionProps {
  userId: string
}

export async function WeeklySection({ userId }: WeeklySectionProps) {
  const supabase = await createClient()

  // Weekly records — cached: shared with InsightsSection, 1 query total.
  const weeklyRecords = await getWeeklyRecords(userId)

  // Target BP from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_systolic, target_diastolic')
    .eq('id', userId)
    .maybeSingle()

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
    <>
      <WeeklySummaryCard
        weeklyAverage={weeklyAverage}
        recordCount={weeklyRecords?.length || 0}
        records={
          (weeklyRecords as unknown as Parameters<
            typeof WeeklySummaryCard
          >[0]['records']) || []
        }
      />
      <TargetProgressCard
        targetSystolic={profile?.target_systolic ?? null}
        targetDiastolic={profile?.target_diastolic ?? null}
        weeklyAverage={weeklyAverage}
      />
      <QuickStats
        weeklyAverage={weeklyAverage}
        totalRecords={weeklyRecords?.length || 0}
      />
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
            <WeeklyChart
              data={weeklyRecords as unknown as BloodPressureRecord[]}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}
