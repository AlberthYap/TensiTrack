'use client'

import { CategoryDistribution } from '@/app/actions/analytics'
import { CATEGORY_LABELS } from '@/lib/blood-pressure'
import { BloodPressureCategory } from '@/types/blood-pressure.types'

interface CategoryDistributionChartProps {
  data: CategoryDistribution
  days: number
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

export function CategoryDistributionChart({
  data,
  days,
}: CategoryDistributionChartProps) {
  if (data.total === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
        Belum ada data untuk {days} hari terakhir.
      </div>
    )
  }

  // Filter hanya kategori yang muncul (count > 0) untuk pie chart
  const presentItems = data.items.filter((item) => item.count > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
        {/* Custom horizontal-bar distribution */}
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
