import type { MonthlyStats } from '@/types/blood-pressure.types'
import { CATEGORY_LABELS, formatBloodPressure } from '@/lib/blood-pressure'
import {
  Activity,
  CalendarDays,
  Eye,
  Heart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ShareOverviewCardProps {
  stats: MonthlyStats | null
}

/**
 * Hero card untuk halaman share (read-only).
 *
 * Menggunakan [`Card`](components/ui/card.tsx:1) shadcn biasa — sama clean-nya
 * dengan [`MonthlyStatsCard`](components/features/analytics/monthly-stats.tsx:10)
 * di halaman analitik default — supaya section ini seragam dan tidak
 * "teriak" terlalu keras.
 *
 * Angka rata-rata tekanan darah tetap ditonjolkan sebagai focal point
 * (text-5xl/6xl) namun dalam konteks kartu yang bersih, tanpa gradient,
 * glow, atau backdrop-blur.
 */
export function ShareOverviewCard({ stats }: ShareOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </span>
          <span className="flex-1">
            {stats ? `Ringkasan ${stats.monthLabel}` : 'Ringkasan Bulan Ini'}
            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Statistik tampilan berbagi (read-only)
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!stats ? (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada catatan untuk bulan ini.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Focal point: rata-rata tekanan darah */}
            <div className="text-center py-2 border-y border-gray-100 dark:border-gray-800">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Rata-rata tekanan darah
              </p>
              <p className="mt-1 text-5xl sm:text-6xl font-bold tracking-tight tabular-nums leading-none text-gray-900 dark:text-white">
                {formatBloodPressure(
                  stats.averageSystolic,
                  stats.averageDiastolic
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                mmHg · bulan ini
              </p>
            </div>

            {/* Stat tiles mengelilingi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile
                icon={
                  <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                }
                label="Rata-rata Nadi"
                value={
                  stats.averagePulse !== null
                    ? String(stats.averagePulse)
                    : '—'
                }
                suffix={stats.averagePulse !== null ? 'bpm' : ''}
              />
              <StatTile
                icon={
                  <CalendarDays className="w-4 h-4 text-green-600 dark:text-green-400" />
                }
                label="Hari Tercatat"
                value={String(stats.daysTracked)}
                suffix="hari"
              />
              <StatTile
                icon={
                  <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                }
                label="Sistolik Max"
                value={String(stats.highestSystolic)}
                suffix="mmHg"
              />
              <StatTile
                icon={
                  <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                }
                label="Sistolik Min"
                value={String(stats.lowestSystolic)}
                suffix="mmHg"
              />
            </div>

            {/* Sub-info: total readings + kategori dominan */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Total{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalReadings}
                </span>{' '}
                pencatatan
              </span>
              <span>
                Kategori dominan:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {CATEGORY_LABELS[dominantCategory(stats.categoryBreakdown)]}
                </span>
              </span>
            </div>
          </div>
        )}
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}

/**
 * Cari kategori dengan jumlah catatan terbanyak.
 * Fallback ke 'normal' bila objek breakdown kosong.
 */
function dominantCategory(
  breakdown: MonthlyStats['categoryBreakdown']
): keyof typeof CATEGORY_LABELS {
  const entries = Object.entries(breakdown) as Array<
    [keyof typeof CATEGORY_LABELS, number]
  >
  if (entries.length === 0) return 'normal'
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  return sorted[0][0]
}
