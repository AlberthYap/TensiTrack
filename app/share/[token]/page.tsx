import {
  validateShareToken,
  getRecordsByUserId,
  getMonthlyStatsByUserId,
  get30DayChartDataByUserId,
  getCategoryStatsByUserId,
  getTrendComparisonByUserId,
} from '@/app/actions/share'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Lock, Eye } from 'lucide-react'
import { RecordsList } from '@/components/features/records/records-list'
import { ShareOverviewCard } from '@/components/features/analytics/share-monthly-stats'
import { Chart30Days } from '@/components/features/analytics/30-day-chart'
import { CategoryDistributionChart } from '@/components/features/analytics/category-distribution-chart'
import { TrendIndicator } from '@/components/features/analytics/trend-indicator'

interface SharePageProps {
  params: {
    token: string
  }
  searchParams: {
    page?: string
    pageSize?: string
    startDate?: string
    endDate?: string
  }
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const page = Math.max(1, Number(searchParams.page) || 1)
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.pageSize) || 10))
  const startDate = searchParams.startDate || ''
  const endDate = searchParams.endDate || ''

  // Validate token SEKALI per request (atomic via RPC, increments view_count).
  // Setelah ini, semua pengambilan data memakai `userId` yang sudah
  // ter-resolve lewat fungsi `*ByUserId` — sehingga view_count tidak
  // di-increment berulang kali (sebelumnya +5 per load).
  const { data: shareToken, error: tokenError } = await validateShareToken(
    params.token
  )

  if (tokenError || !shareToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 dark:bg-red-950 p-4 rounded-full">
                    <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-center text-red-600 dark:text-red-400">
                  Link Tidak Valid
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {tokenError ||
                    'Link share ini tidak valid, sudah kadaluarsa, atau telah mencapai batas maksimal views.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Silakan hubungi pemilik data untuk mendapatkan link baru.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const userId = shareToken.user_id

  // Fetch records + analytics in parallel menggunakan userId yang sudah
  // ter-resolve. TIDAK ada validasi token lagi di sini, sehingga view_count
  // hanya bertambah 1 (dari validateShareToken di atas).
  // Semua fetch analytics di-wrap `.catch(() => null/[])` agar gagal total
  // tidak menjatuhkan halaman — records tetap tampil.
  const recordsPromise = getRecordsByUserId(userId, {
    page,
    pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const monthlyStatsPromise = getMonthlyStatsByUserId(userId).catch(() => null)
  const chartDataPromise = get30DayChartDataByUserId(userId, 30).catch(
    () => [] as Awaited<ReturnType<typeof get30DayChartDataByUserId>>
  )
  const categoryDataPromise = getCategoryStatsByUserId(userId, 30).catch(
    () =>
      ({
        total: 0,
        items: [],
      }) as Awaited<ReturnType<typeof getCategoryStatsByUserId>>
  )
  const trendPromise = getTrendComparisonByUserId(userId, 30).catch(
    () =>
      ({
        current: {
          startDate: '',
          endDate: '',
          averageSystolic: 0,
          averageDiastolic: 0,
          readingCount: 0,
        },
        previous: {
          startDate: '',
          endDate: '',
          averageSystolic: 0,
          averageDiastolic: 0,
          readingCount: 0,
        },
        systolicChange: 0,
        diastolicChange: 0,
        systolicTrend: 'stable' as const,
        diastolicTrend: 'stable' as const,
      }) as Awaited<ReturnType<typeof getTrendComparisonByUserId>>
  )

  const [
    {
      data: records,
      error,
      total,
      totalPages,
    },
    monthlyStats,
    chartData,
    categoryData,
    trendComparison,
  ] = await Promise.all([
    recordsPromise,
    monthlyStatsPromise,
    chartDataPromise,
    categoryDataPromise,
    trendPromise,
  ])

  if (error && (!records || records.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 dark:bg-red-950 p-4 rounded-full">
                    <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-center text-red-600 dark:text-red-400">
                  Link Tidak Valid
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {error || 'Link share ini tidak valid, sudah kadaluarsa, atau telah mencapai batas maksimal views.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Silakan hubungi pemilik data untuk mendapatkan link baru.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tensi Harian
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Tampilan Berbagi (Read-Only)
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                <Lock className="w-4 h-4 inline mr-2" />
                Anda melihat data yang dibagikan. Data ini hanya untuk dibaca dan tidak dapat diubah.
              </p>
            </CardContent>
          </Card>

          {/* Analytics Section — hero + 3 chart cards */}
          <div className="space-y-6 mb-8">
            <ShareOverviewCard stats={monthlyStats} />
            <Chart30Days data={chartData} variant="glass" />
            <CategoryDistributionChart data={categoryData} days={30} variant="glass" />
            <TrendIndicator comparison={trendComparison} periodDays={30} variant="glass" />
          </div>

          {/* Records */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Riwayat Pencatatan
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Total {total} pencatatan
                </p>
              </div>
            </div>

            <RecordsList
              records={records || []}
              total={total}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              startDate={startDate}
              endDate={endDate}
              basePath={`/share/${params.token}`}
              readOnly
            />
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by <span className="font-semibold">Tensi Harian</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
