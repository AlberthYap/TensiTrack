'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { DailyPoint } from '@/types/blood-pressure.types'
import { Eye, LineChart as LineChartIcon } from 'lucide-react'

interface Chart30DaysProps {
  data: DailyPoint[]
  /** Skin kartu. Default: kartu Analytics standar. Glass: chrome share-page. */
  variant?: 'default' | 'glass'
  /** Label judul kartu. Default: "Grafik 30 Hari Terakhir". */
  title?: string
  /** Subjudul kartu. Default: "Tekanan sistolik & diastolik harian". */
  description?: string
}

/**
 * Custom tooltip untuk grafik 30 hari.
 * Menampilkan tanggal lengkap, nilai systolic/diastolic/pulse,
 * dan jumlah pembacaan pada hari tersebut.
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0]?.payload as DailyPoint | undefined
  if (!point) return null

  const hasReading = point.systolic !== null && point.diastolic !== null

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md p-3 text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">
        {point.date}
      </p>
      {hasReading ? (
        <>
          <p className="text-red-600 dark:text-red-400">
            Sistolik: <span className="font-medium">{point.systolic} mmHg</span>
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            Diastolik: <span className="font-medium">{point.diastolic} mmHg</span>
          </p>
          {point.pulse !== null && (
            <p className="text-purple-600 dark:text-purple-400">
              Nadi: <span className="font-medium">{point.pulse} bpm</span>
            </p>
          )}
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {point.count} pembacaan
          </p>
        </>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">Tidak ada data</p>
      )}
    </div>
  )
}

function ChartBody({ data }: { data: DailyPoint[] }) {
  const hasData = data.some((d) => d.systolic !== null)

  if (!hasData) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Belum ada data untuk 30 hari terakhir.
      </div>
    )
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          {/* AHA thresholds */}
          <ReferenceLine
            y={120}
            stroke="#eab308"
            strokeDasharray="4 4"
            label={{
              value: '120',
              position: 'right',
              fill: '#eab308',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={80}
            stroke="#3b82f6"
            strokeDasharray="4 4"
            label={{
              value: '80',
              position: 'right',
              fill: '#3b82f6',
              fontSize: 10,
            }}
          />
          <XAxis
            dataKey="label"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            interval="preserveStartEnd"
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            domain={[50, 180]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#ef4444"
            strokeWidth={2}
            name="Sistolik"
            dot={{ r: 3, fill: '#ef4444' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Diastolik"
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Chart30Days({
  data,
  variant = 'default',
  title = 'Grafik 30 Hari Terakhir',
  description = 'Tekanan sistolik & diastolik harian',
}: Chart30DaysProps) {
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
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          </div>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
            <LineChartIcon className="w-4 h-4 text-white" />
          </span>
        </header>
        <div className="p-5 sm:p-6">
          <ChartBody data={data} />
        </div>
      </section>
    )
  }

  return <ChartBody data={data} />
}
