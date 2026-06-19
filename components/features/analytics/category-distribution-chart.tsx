import { CategoryDistribution, BloodPressureCategory } from '@/types/blood-pressure.types'
import { CATEGORY_LABELS } from '@/lib/blood-pressure'
import { Eye, PieChart } from 'lucide-react'

interface CategoryDistributionChartProps {
  data: CategoryDistribution
  days: number
  /** Skin kartu. Default: polos. Glass: chrome share-page. */
  variant?: 'default' | 'glass'
}

/**
 * Peta kategori -> warna utama (hex) untuk chart & legenda.
 * Tailwind: low=blue, normal=green, elevated=yellow, hs1=orange, hs2=red.
 */
const CATEGORY_COLORS: Record<BloodPressureCategory, string> = {
  low: '#3b82f6',
  normal: '#10b981',
  elevated: '#eab308',
  hypertension_stage_1: '#f97316',
  hypertension_stage_2: '#ef4444',
}

function DistributionBody({ data, days }: { data: CategoryDistribution; days: number }) {
  if (data.total === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        Belum ada data untuk {days} hari terakhir.
      </div>
    )
  }

  const presentItems = data.items.filter((item) => item.count > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
        <div className="flex-1 space-y-3">
          {presentItems.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: CATEGORY_COLORS[item.category],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Total {data.total} pembacaan dalam {days} hari terakhir.
      </p>
    </div>
  )
}

export function CategoryDistributionChart({
  data,
  days,
  variant = 'default',
}: CategoryDistributionChartProps) {
  if (variant === 'glass') {
    return (
      <section className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 overflow-hidden">
        <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-white/40 dark:border-white/5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-violet-600 dark:text-violet-400">
              <Eye className="w-3 h-3" />
              Dilihat via link berbagi
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Distribusi Kategori ({days} Hari)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Persentase kategori tekanan darah
            </p>
          </div>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-md">
            <PieChart className="w-4 h-4 text-white" />
          </span>
        </header>
        <div className="p-5 sm:p-6">
          <DistributionBody data={data} days={days} />
        </div>
      </section>
    )
  }

  return <DistributionBody data={data} days={days} />
}
