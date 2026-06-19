'use client'

import type { ShareCategoryDistribution } from '@/app/actions/share'
import { CategoryDistributionChart } from '@/components/features/analytics/category-distribution-chart'
import { PieChart, Eye } from 'lucide-react'

interface ShareCategoryChartProps {
  data: ShareCategoryDistribution
  days?: number
}

/**
 * Wrapper share-page untuk [`CategoryDistributionChart`](components/features/analytics/category-distribution-chart.tsx:24).
 *
 * Chrome glass card yang konsisten dengan kartu share lain. Logika render
 * bar distribusi tetap di komponen asli.
 */
export function ShareCategoryChart({ data, days = 30 }: ShareCategoryChartProps) {
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
        <CategoryDistributionChart data={data} days={days} />
      </div>
    </section>
  )
}
