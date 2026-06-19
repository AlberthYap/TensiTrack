'use client'

import type { ShareDailyPoint } from '@/app/actions/share'
import { Chart30Days } from '@/components/features/analytics/30-day-chart'
import { LineChart, Eye } from 'lucide-react'

interface Share30DayChartProps {
  data: ShareDailyPoint[]
  days?: number
}

/**
 * Wrapper share-page untuk [`Chart30Days`](components/features/analytics/30-day-chart.tsx:62).
 *
 * Memberikan chrome glass card yang konsisten dengan [`ShareOverviewCard`](components/features/analytics/share-monthly-stats.tsx:28)
 * dan dua kartu share lainnya — supaya section analitik di halaman share
 * terlihat sebagai satu kesatuan visual yang berbeda dari halaman analitik
 * default.
 *
 * Logika render chart (line + reference lines + tooltip) tetap di komponen
 * asli agar single source of truth terjaga.
 */
export function Share30DayChart({ data, days = 30 }: Share30DayChartProps) {
  const hasData = data.some((d) => d.systolic !== null)

  return (
    <section className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg shadow-blue-900/5 overflow-hidden">
      <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-white/40 dark:border-white/5">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-violet-600 dark:text-violet-400">
            <Eye className="w-3 h-3" />
            Dilihat via link berbagi
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            Grafik {days} Hari Terakhir
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Tekanan sistolik & diastolik harian
          </p>
        </div>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
          <LineChart className="w-4 h-4 text-white" />
        </span>
      </header>
      <div className="p-5 sm:p-6">
        {hasData ? (
          <Chart30Days data={data} />
        ) : (
          <div className="w-full h-[320px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada data untuk {days} hari terakhir.
          </div>
        )}
      </div>
    </section>
  )
}
