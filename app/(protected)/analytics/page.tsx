import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Calendar, PieChart, TrendingUp } from 'lucide-react'
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analitik
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Pantau tren dan pola tekanan darah Anda
        </p>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Gagal memuat data analitik
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Silakan coba muat ulang halaman ini.
            </p>
          </CardContent>
        </Card>
      ) : !hasAnyData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Belum ada data analitik
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Mulai catat tekanan darah secara rutin untuk melihat analitik
              lengkap di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Monthly Stats */}
          <MonthlyStatsCard stats={monthly} />

          {/* Trend Comparison */}
          {trend && (
            <TrendIndicator comparison={trend} periodDays={30} />
          )}

          {/* 30-Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Grafik 30 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Chart30Days data={chartData} />
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribusi Kategori (30 Hari)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryDistributionChart data={categoryData} days={30} />
            </CardContent>
          </Card>

          {/* Info footer */}
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
            <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>
              Threshold grafik: garis kuning 120 mmHg (Elevated), garis biru
              80 mmHg (diastolik normal). Kategori dihitung mengikuti
              pedoman AHA.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
