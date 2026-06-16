import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Calendar, Info, LineChart, PieChart, Sparkles, TrendingUp } from 'lucide-react'
import {
  getCategoryStats,
  getMonthlyStats,
  get30DayChartData,
  getTrendComparison,
} from '@/app/actions/analytics'
import { MonthlyStatsCard } from '@/components/features/analytics/monthly-stats'
import { Chart30Days } from '@/components/features/analytics/30-day-chart'
import { CategoryDistributionChart } from '@/components/features/analytics/category-distribution-chart'
import { TrendIndicator } from '@/components/features/analytics/trend-indicator'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  // Fetch all analytics data in parallel server-side.
  // Any failure is caught and shown as a friendly empty state
  // so that a single missing series never breaks the whole page.
  let monthly: Awaited<ReturnType<typeof getMonthlyStats>> = null
  let chartData: Awaited<ReturnType<typeof get30DayChartData>> = []
  let categoryData: Awaited<ReturnType<typeof getCategoryStats>> = {
    total: 0,
    items: [],
  }
  let trend: Awaited<ReturnType<typeof getTrendComparison>> | null = null
  let loadError = false

  try {
    const [monthlyResult, chartResult, categoryResult, trendResult] =
      await Promise.all([
        getMonthlyStats(),
        get30DayChartData(30),
        getCategoryStats(30),
        getTrendComparison(30),
      ])
    monthly = monthlyResult
    chartData = chartResult
    categoryData = categoryResult
    trend = trendResult
  } catch (error) {
    console.error('Failed to load analytics:', error)
    loadError = true
  }

  const hasAnyData =
    (monthly && monthly.totalReadings > 0) ||
    chartData.some((d) => d.systolic !== null) ||
    categoryData.total > 0

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Analitik' }]} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-purple shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-purple-600 dark:text-purple-400 uppercase">
              Wawasan & Pola
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
            Analitik Tekanan Darah
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Pantau tren, pola, dan distribusi kategori tekanan darah Anda
          </p>
        </div>
      </div>

      {loadError ? (
        <Card className="animate-fade-in-up">
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Gagal memuat data analitik"
              description="Terjadi kesalahan saat memuat analitik Anda. Silakan coba muat ulang halaman ini."
              gradient="warm"
            />
          </CardContent>
        </Card>
      ) : !hasAnyData ? (
        <Card className="animate-fade-in-up">
          <CardContent className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Belum ada data analitik"
              description="Mulai catat tekanan darah secara rutin untuk melihat analitik lengkap di sini."
              gradient="hero"
              action={
                <Link href="/records/new">
                  <Button className="bg-gradient-hero hover:shadow-glow">
                    <Activity className="w-4 h-4 mr-2" />
                    Catat Tekanan Darah
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 stagger-children">
          {/* Monthly Stats */}
          <MonthlyStatsCard stats={monthly} />

          {/* Trend Comparison */}
          {trend && (
            <TrendIndicator comparison={trend} periodDays={30} />
          )}

          {/* 30-Day Chart */}
          <Card className="overflow-hidden animate-fade-in-up">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-cool shadow-md">
                  <LineChart className="w-4 h-4 text-white" />
                </span>
                <span>
                  Grafik 30 Hari Terakhir
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                    Tekanan sistolik & diastolik harian
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Chart30Days data={chartData} />
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="overflow-hidden animate-fade-in-up">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-purple shadow-md">
                  <PieChart className="w-4 h-4 text-white" />
                </span>
                <span>
                  Distribusi Kategori (30 Hari)
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                    Persentase kategori tekanan darah
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <CategoryDistributionChart data={categoryData} days={30} />
            </CardContent>
          </Card>

          {/* Info footer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900 text-xs text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-cool flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-white" />
            </span>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">Threshold grafik:</strong> garis kuning 120 mmHg (Elevated), garis biru 80 mmHg (diastolik normal). Kategori dihitung mengikuti pedoman AHA (American Heart Association).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
