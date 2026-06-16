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
import { DailyPoint } from '@/app/actions/analytics'

interface Chart30DaysProps {
  data: DailyPoint[]
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

export function Chart30Days({ data }: Chart30DaysProps) {
  // If at least one day has readings, show full chart with reference lines.
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
