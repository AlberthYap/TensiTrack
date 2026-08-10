import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sparkles } from 'lucide-react'
import { LatestReadingSection } from '@/components/features/dashboard/latest-reading-section'
import { WeeklySection } from '@/components/features/dashboard/weekly-section'
import { StreakSection } from '@/components/features/dashboard/streak-section'
import { InsightsSection } from '@/components/features/dashboard/insights-section'
import { MedicationSection } from '@/components/features/dashboard/medication-section'
import { RiskGaugeSection } from '@/components/features/dashboard/risk-gauge-section'
import { QuickAddButton } from '@/components/features/dashboard/quick-add-button'
import { Skeleton, SkeletonStatCard, SkeletonChart } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Page Header — instant, no data needed */}
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

      {/* Latest Reading — streams first (single, fast query) */}
      <Suspense fallback={<SkeletonStatCard />}>
        <LatestReadingSection userId={user.id} />
      </Suspense>

      {/* Insights — moderate query, streams after latest reading */}
      <Suspense
        fallback={
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
        }
      >
        <InsightsSection userId={user.id} />
      </Suspense>

      {/* Weekly data — the heaviest chunk (2 queries + chart) */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonChart height={220} />
          </div>
        }
      >
        <WeeklySection userId={user.id} />
      </Suspense>

      {/* Streak — independent query */}
      <Suspense fallback={<SkeletonStatCard />}>
        <StreakSection userId={user.id} />
      </Suspense>

      {/* Risk Gauge */}
      <Suspense fallback={<SkeletonStatCard />}>
        <RiskGaugeSection />
      </Suspense>

      {/* Medications — independent query */}
      <Suspense
        fallback={
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        }
      >
        <MedicationSection userId={user.id} />
      </Suspense>

      {/* Quick Add Button — instant */}
      <QuickAddButton />
    </div>
  )
}
