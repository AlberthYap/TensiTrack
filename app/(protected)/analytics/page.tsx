import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BarChart3, Calendar, Info, LineChart, PieChart, Sparkles, TrendingUp, ArrowRight, ArrowDown, Minus } from 'lucide-react'
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
import { TrendInsights } from '@/components/features/analytics/trend-insights'
import { DiurnalSection } from '@/components/features/analytics/diurnal-section'
import { TagCorrelationSection } from '@/components/features/analytics/tag-correlation-section'
import { generateTrendInsights, type Insight } from '@/lib/insights'
import { EmptyState } from '@/components/ui/empty-state'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getAppDateKey } from '@/lib/timezone'
export const dynamic = 'force-dynamic'

interface AnalyticsPageProps {
  searchParams: {
    year?: string
    month?: string
    compareYear?: string
    compareMonth?: string
  }
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const MONTHS_12 = Array.from({ length: 12 }, (_, i) => i + 1)

function trendIcon(a: number, b: number) {
  const diff = a - b
  if (Math.abs(diff) < 2) return <Minus className="w-3.5 h-3.5 text-gray-400" />
  if (diff > 0) return <ArrowRight className="w-3.5 h-3.5 text-red-500 rotate-45" />
  return <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
}

function CompareMonthsCard({
  current,
  compare,
  currentLabel,
  compareLabel,
}: {
  current: Awaited<ReturnType<typeof getMonthlyStats>>
  compare: Awaited<ReturnType<typeof getMonthlyStats>>
  currentLabel: string
  compareLabel: string
}) {
  if (!current || !compare) return null

  const rows = [
    { label: 'Total Pencatatan', curr: current.totalReadings, comp: compare.totalReadings, unit: '' },
    { label: 'Rata-rata Sistolik', curr: current.averageSystolic, comp: compare.averageSystolic, unit: ' mmHg' },
    { label: 'Rata-rata Diastolik', curr: current.averageDiastolic, comp: compare.averageDiastolic, unit: ' mmHg' },
    { label: 'Tertinggi Sistolik', curr: current.highestSystolic, comp: compare.highestSystolic, unit: ' mmHg' },
    { label: 'Terendah Sistolik', curr: current.lowestSystolic, comp: compare.lowestSystolic, unit: ' mmHg' },
    { label: 'Hari Tercatat', curr: current.daysTracked, comp: compare.daysTracked, unit: '' },
  ]

  return (
    <Card className="overflow-hidden border-indigo-200 dark:border-indigo-800">
      <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Perbandingan Bulanan
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Metrik</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-white">{currentLabel}</th>
                <th className="text-center py-2 px-3 w-8" />
                <th className="text-right py-2 pl-3 font-semibold text-gray-700 dark:text-gray-300">{compareLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{row.label}</td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                    {row.curr}{row.unit}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {trendIcon(row.curr as number, row.comp as number)}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {row.comp}{row.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const [currentYear, currentMonth] = getAppDateKey().split('-').map(Number)
  const selectedYear = Number(searchParams.year) || currentYear
  const selectedMonth = Number(searchParams.month) || currentMonth
  const compareYear = Number(searchParams.compareYear) || 0
  const compareMonth = Number(searchParams.compareMonth) || 0
  const hasCompare = compareYear > 0 && compareMonth > 0

  // Fetch all analytics data in parallel server-side.
  let monthly: Awaited<ReturnType<typeof getMonthlyStats>> = null
  let chartData: Awaited<ReturnType<typeof get30DayChartData>> = []
  let categoryData: Awaited<ReturnType<typeof getCategoryStats>> = {
    total: 0,
    items: [],
  }
  let compareMonthly: Awaited<ReturnType<typeof getMonthlyStats>> = null
  let trend: Awaited<ReturnType<typeof getTrendComparison>> | null = null
  let insights: Insight[] = []
  let loadError = false

  try {
    const fetches: Promise<unknown>[] = [
      getMonthlyStats(selectedYear, selectedMonth),
      get30DayChartData(30),
      getCategoryStats(30),
      getTrendComparison(30),
    ]
    if (hasCompare) {
      fetches.push(getMonthlyStats(compareYear, compareMonth))
    }
    const results = await Promise.all(fetches)
    monthly = results[0] as Awaited<ReturnType<typeof getMonthlyStats>>
    chartData = results[1] as Awaited<ReturnType<typeof get30DayChartData>>
    categoryData = results[2] as Awaited<ReturnType<typeof getCategoryStats>>
    trend = results[3] as Awaited<ReturnType<typeof getTrendComparison>>
    compareMonthly = hasCompare
      ? (results[4] as Awaited<ReturnType<typeof getMonthlyStats>>)
      : null
    insights = trend ? generateTrendInsights(trend) : []
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
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
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

      {/* Month/Year Picker */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <form className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="analyticsMonth" className="text-xs">Bulan</Label>
              <select
                id="analyticsMonth"
                name="month"
                defaultValue={selectedMonth}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {MONTHS_12.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="analyticsYear" className="text-xs">Tahun</Label>
              <select
                id="analyticsYear"
                name="year"
                defaultValue={selectedYear}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" variant="outline">
              Tampilkan
            </Button>
            {(selectedYear !== currentYear || selectedMonth !== currentMonth || hasCompare) && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/analytics">↩ Bulan Ini</Link>
              </Button>
            )}
          </form>

          {/* Comparison picker — second row */}
          <form className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500 dark:text-gray-400">Bandingkan dengan:</span>
            <input type="hidden" name="year" value={selectedYear} />
            <input type="hidden" name="month" value={selectedMonth} />
            <div className="flex items-center gap-2">
              <Label htmlFor="compareMonth" className="text-xs">Bulan</Label>
              <select
                id="compareMonth"
                name="compareMonth"
                defaultValue={compareMonth || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">--</option>
                {MONTHS_12.map((m) => (
                  <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="compareYear" className="text-xs">Tahun</Label>
              <select
                id="compareYear"
                name="compareYear"
                defaultValue={compareYear || ''}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">--</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" variant="outline">
              Bandingkan
            </Button>
          </form>
        </CardContent>
      </Card>

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
                  <Button className="bg-blue-600 hover:shadow-md">
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
          {/* Comparison Table */}
          {hasCompare && (
            <CompareMonthsCard
              current={monthly}
              compare={compareMonthly as Awaited<ReturnType<typeof getMonthlyStats>>}
              currentLabel={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
              compareLabel={`${MONTH_NAMES[compareMonth - 1]} ${compareYear}`}
            />
          )}

          {/* Diurnal & Tag Correlation */}
          <DiurnalSection />
          <TagCorrelationSection />

          {/* Monthly Stats */}
          <MonthlyStatsCard stats={monthly} />

          {/* Trend Comparison */}
          {trend && (
            <TrendIndicator comparison={trend} periodDays={30} />
          )}

          {insights.length > 0 && <TrendInsights insights={insights} />}

          {/* 30-Day Chart */}
          <Card className="overflow-hidden animate-fade-in-up">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-950/20">
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
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600 shadow-md">
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
