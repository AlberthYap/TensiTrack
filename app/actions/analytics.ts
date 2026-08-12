'use server'

// Re-export analytics types for backwards-compatible imports.
export type {
  MonthlyStats,
  DailyPoint,
  CategoryDistribution,
  TrendComparison,
} from '@/types/blood-pressure.types'

import { createClient } from '@/lib/supabase/server'
import {
  BloodPressureCategory,
  BloodPressureRecord,
  MonthlyStats,
  DailyPoint,
  CategoryDistribution,
  TrendComparison,
} from '@/types/blood-pressure.types'
import { calculateCategory } from '@/lib/blood-pressure'
import {
  addAppDateDays,
  getAppDateKey,
  formatAppDateKeyLabel,
  getAppMonthRangeUtc,
  getAppPeriodRangesUtc,
  getAppRollingRangeUtc,
} from '@/lib/timezone'

/** Get monthly aggregate statistics for a specific Asia/Jakarta calendar month. */
export async function getMonthlyStats(
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [currentYear, currentMonth] = getAppDateKey().split('-').map(Number)
  const targetYear = year ?? currentYear
  const targetMonth = month ?? currentMonth
  const monthRange = getAppMonthRangeUtc(targetYear, targetMonth)

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', monthRange.start)
    .lte('measured_at', monthRange.end)
    .order('measured_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly stats:', error)
    throw new Error('Gagal memuat statistik bulanan')
  }
  if (!data || data.length === 0) return null

  const totalReadings = data.length
  const sumSystolic = data.reduce((acc, r) => acc + r.systolic, 0)
  const sumDiastolic = data.reduce((acc, r) => acc + r.diastolic, 0)
  const pulseValues = data
    .map((r) => r.pulse)
    .filter((p): p is number => typeof p === 'number')
  const averagePulse = pulseValues.length > 0
    ? Math.round(pulseValues.reduce((acc, p) => acc + p, 0) / pulseValues.length)
    : null

  const categoryBreakdown: Record<BloodPressureCategory, number> = {
    low: 0,
    normal: 0,
    elevated: 0,
    hypertension_stage_1: 0,
    hypertension_stage_2: 0,
  }
  for (const r of data) categoryBreakdown[calculateCategory(r.systolic, r.diastolic)]++

  const uniqueDays = new Set(data.map((r) => getAppDateKey(r.measured_at)))
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  return {
    year: targetYear,
    month: targetMonth,
    monthLabel: `${monthNames[targetMonth - 1]} ${targetYear}`,
    totalReadings,
    averageSystolic: Math.round(sumSystolic / totalReadings),
    averageDiastolic: Math.round(sumDiastolic / totalReadings),
    averagePulse,
    highestSystolic: Math.max(...data.map((r) => r.systolic)),
    highestDiastolic: Math.max(...data.map((r) => r.diastolic)),
    lowestSystolic: Math.min(...data.map((r) => r.systolic)),
    lowestDiastolic: Math.min(...data.map((r) => r.diastolic)),
    categoryBreakdown,
    daysTracked: uniqueDays.size,
  }
}

/** Get category distribution for the last `days` Asia/Jakarta calendar days. */
export async function getCategoryStats(days: number = 30): Promise<CategoryDistribution> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const range = getAppRollingRangeUtc(days)
  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('systolic, diastolic, category')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', range.start)

  if (error) {
    console.error('Error fetching category stats:', error)
    throw new Error('Gagal memuat distribusi kategori')
  }

  const total = data?.length ?? 0
  const counts: Record<BloodPressureCategory, number> = {
    low: 0,
    normal: 0,
    elevated: 0,
    hypertension_stage_1: 0,
    hypertension_stage_2: 0,
  }
  for (const r of data ?? []) counts[calculateCategory(r.systolic, r.diastolic)]++

  const order: BloodPressureCategory[] = [
    'hypertension_stage_2',
    'hypertension_stage_1',
    'elevated',
    'normal',
    'low',
  ]
  return {
    total,
    items: order.map((category) => ({
      category,
      count: counts[category],
      percentage: total > 0 ? (counts[category] / total) * 100 : 0,
    })),
  }
}

/** Compare two equal-length periods using Asia/Jakarta calendar boundaries. */
export async function getTrendComparison(
  periodDays: number = 30
): Promise<TrendComparison> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const ranges = getAppPeriodRangesUtc(periodDays)
  const fetchRange = (range: { start: string; end: string }) =>
    supabase
      .from('blood_pressure_records')
      .select('systolic, diastolic')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('measured_at', range.start)
      .lte('measured_at', range.end)

  const [{ data: currentData }, { data: previousData }] = await Promise.all([
    fetchRange(ranges.current),
    fetchRange(ranges.previous),
  ])

  const summarize = (rows: { systolic: number; diastolic: number }[] | null) => {
    if (!rows || rows.length === 0) {
      return { averageSystolic: 0, averageDiastolic: 0, readingCount: 0 }
    }
    return {
      averageSystolic: Math.round(rows.reduce((sum, r) => sum + r.systolic, 0) / rows.length),
      averageDiastolic: Math.round(rows.reduce((sum, r) => sum + r.diastolic, 0) / rows.length),
      readingCount: rows.length,
    }
  }

  const current = summarize(currentData)
  const previous = summarize(previousData)
  const systolicChange = current.averageSystolic - previous.averageSystolic
  const diastolicChange = current.averageDiastolic - previous.averageDiastolic

  return {
    current: { startDate: ranges.current.start, endDate: ranges.current.end, ...current },
    previous: { startDate: ranges.previous.start, endDate: ranges.previous.end, ...previous },
    systolicChange,
    diastolicChange,
    systolicTrend: classifyTrend(systolicChange),
    diastolicTrend: classifyTrend(diastolicChange),
  }
}

function classifyTrend(change: number): 'up' | 'down' | 'stable' {
  if (Math.abs(change) < 3) return 'stable'
  return change > 0 ? 'up' : 'down'
}

/** Get daily aggregate points for the last `days` Asia/Jakarta calendar days. */
export async function get30DayChartData(days: number = 30): Promise<DailyPoint[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const range = getAppRollingRangeUtc(days)
  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', range.start)
    .lte('measured_at', range.end)
    .order('measured_at', { ascending: true })

  if (error) {
    console.error('Error fetching chart data:', error)
    throw new Error('Gagal memuat data grafik')
  }

  const buckets = new Map<string, {
    systolicSum: number
    diastolicSum: number
    pulseSum: number
    pulseCount: number
    count: number
  }>()

  for (const r of data ?? []) {
    const key = getAppDateKey(r.measured_at)
    const bucket = buckets.get(key) ?? {
      systolicSum: 0,
      diastolicSum: 0,
      pulseSum: 0,
      pulseCount: 0,
      count: 0,
    }
    bucket.systolicSum += r.systolic
    bucket.diastolicSum += r.diastolic
    bucket.count++
    if (typeof r.pulse === 'number') {
      bucket.pulseSum += r.pulse
      bucket.pulseCount++
    }
    buckets.set(key, bucket)
  }

  const result: DailyPoint[] = []
  for (let i = 0; i < days; i++) {
    const date = addAppDateDays(range.startDateKey, i)
    const bucket = buckets.get(date)
    result.push({
      date,
      label: formatAppDateKeyLabel(date),
      systolic: bucket ? Math.round(bucket.systolicSum / bucket.count) : null,
      diastolic: bucket ? Math.round(bucket.diastolicSum / bucket.count) : null,
      pulse: bucket && bucket.pulseCount > 0
        ? Math.round(bucket.pulseSum / bucket.pulseCount)
        : null,
      count: bucket?.count ?? 0,
    })
  }
  return result
}

export type { BloodPressureRecord }
