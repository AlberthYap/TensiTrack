'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Calendar, Activity } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/category-badge'
import { calculateCategory } from '@/lib/blood-pressure'
import { cn } from '@/lib/utils'

type PreviewPoint = {
  date: string
  day: string
  systolic: number
  diastolic: number
}

const MOCK_DATA: PreviewPoint[] = [
  { date: '15 Jan', day: 'Sen', systolic: 120, diastolic: 80 },
  { date: '16 Jan', day: 'Sel', systolic: 125, diastolic: 82 },
  { date: '17 Jan', day: 'Rab', systolic: 130, diastolic: 85 },
  { date: '18 Jan', day: 'Kam', systolic: 122, diastolic: 79 },
  { date: '19 Jan', day: 'Jum', systolic: 138, diastolic: 88 },
  { date: '20 Jan', day: 'Sab', systolic: 145, diastolic: 92 },
  { date: '21 Jan', day: 'Min', systolic: 130, diastolic: 85 },
]

const CATEGORY_SUMMARY = [
  { label: 'Normal', count: 4, color: 'bg-blue-500' },
  { label: 'Meningkat', count: 2, color: 'bg-blue-400' },
  { label: 'Hipertensi 1', count: 1, color: 'bg-blue-600' },
]

// Mid-tone blue palette (Tailwind blue-400/500/600)
const SYSTOLIC_COLOR = '#2563eb' // blue-600
const DIASTOLIC_COLOR = '#60a5fa' // blue-400
const REFERENCE_COLOR = '#60a5fa' // blue-400

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as PreviewPoint | undefined
  if (!point) return null
  const category = calculateCategory(point.systolic, point.diastolic)

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-blue-100 dark:border-blue-900/40 p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1.5">
        {point.date}
      </p>
      <div className="space-y-1">
        <p className="text-xs flex items-center justify-between gap-3">
          <span className="text-blue-700 dark:text-blue-300">Sistolik:</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {point.systolic} mmHg
          </span>
        </p>
        <p className="text-xs flex items-center justify-between gap-3">
          <span className="text-blue-600 dark:text-blue-300">Diastolik:</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {point.diastolic} mmHg
          </span>
        </p>
        <div className="pt-1">
          <CategoryBadge category={category} size="sm" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPreview() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const activePoint =
    activeIndex !== null ? MOCK_DATA[activeIndex] : null
  const activeCategory = activePoint
    ? calculateCategory(activePoint.systolic, activePoint.diastolic)
    : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg shadow-blue-900/5 border border-blue-100 dark:border-blue-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-blue-100 dark:border-blue-900/40">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Riwayat 7 Hari
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            15 — 21 Januari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
            <Activity className="w-3 h-3" />
            7 readings
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 sm:p-6">
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={MOCK_DATA}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <defs>
                <linearGradient id="gradSystolic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SYSTOLIC_COLOR} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SYSTOLIC_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-blue-100 dark:text-blue-900/30"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                className="text-blue-600 dark:text-blue-400"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[60, 160]}
                tick={{ fill: 'currentColor', fontSize: 12 }}
                className="text-blue-600 dark:text-blue-400"
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine
                y={120}
                stroke={REFERENCE_COLOR}
                strokeDasharray="4 4"
                label={{
                  value: 'Batas normal',
                  fill: '#2563eb',
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="systolic"
                stroke={SYSTOLIC_COLOR}
                strokeWidth={2.5}
                dot={{ r: 4, fill: SYSTOLIC_COLOR, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 3 }}
                name="Sistolik"
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                stroke={DIASTOLIC_COLOR}
                strokeWidth={2.5}
                dot={{ r: 4, fill: DIASTOLIC_COLOR, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 3 }}
                name="Diastolik"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend custom */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SYSTOLIC_COLOR }} />
            <span className="text-blue-700 dark:text-blue-300">Sistolik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DIASTOLIC_COLOR }} />
            <span className="text-blue-600 dark:text-blue-300">Diastolik</span>
          </div>
        </div>

        {/* Active point detail */}
        {activePoint && activeCategory && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 animate-fade-in">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 flex-wrap">
              <span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  {activePoint.systolic}/{activePoint.diastolic}
                </span>{' '}
                mmHg
              </span>
              <CategoryBadge category={activeCategory} size="sm" />
            </p>
          </div>
        )}
      </div>

      {/* Category Summary */}
      <div className="border-t border-blue-100 dark:border-blue-900/40 p-5 sm:p-6 bg-gradient-to-br from-blue-50/40 to-white dark:from-blue-950/20 dark:to-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Ringkasan minggu ini
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORY_SUMMARY.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-gray-900',
                'border border-blue-100 dark:border-blue-900/40'
              )}
            >
              <div className={cn('w-2 h-8 rounded-full', item.color)} />
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {item.label}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.count}
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-normal ml-1">hari</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-blue-600 dark:text-blue-400 text-center">
          Data contoh dari pengguna nyata — hanya untuk demonstrasi UI.
        </p>
      </div>
    </div>
  )
}
