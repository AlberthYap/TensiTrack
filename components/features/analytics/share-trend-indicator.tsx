import type { ShareTrendComparison } from '@/app/actions/share'
import { TrendIndicator } from '@/components/features/analytics/trend-indicator'
import { GitCompare, Eye } from 'lucide-react'

interface ShareTrendIndicatorProps {
  comparison: ShareTrendComparison
  periodDays?: number
}

/**
 * Wrapper share-page untuk [`TrendIndicator`](components/features/analytics/trend-indicator.tsx:18).
 *
 * Chrome glass card yang konsisten dengan kartu share lain. Logika render
 * tren tetap di komponen asli.
 */
export function ShareTrendIndicator({
  comparison,
  periodDays = 30,
}: ShareTrendIndicatorProps) {
  return (
    <section className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 overflow-hidden">
      <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-white/40 dark:border-white/5">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-violet-600 dark:text-violet-400">
            <Eye className="w-3 h-3" />
            Dilihat via link berbagi
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Tren {periodDays} Hari
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Perbandingan dengan {periodDays} hari sebelumnya
          </p>
        </div>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
          <GitCompare className="w-4 h-4 text-white" />
        </span>
      </header>
      <div className="p-5 sm:p-6">
        <TrendIndicator comparison={comparison} periodDays={periodDays} />
      </div>
    </section>
  )
}
