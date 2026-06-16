'use server'

import { createClient } from '@/lib/supabase/server'
import { BloodPressureCategory, BloodPressureRecord } from '@/types/blood-pressure.types'
import { calculateCategory } from '@/lib/blood-pressure'

/**
 * Aggregated statistics for a calendar month.
 */
export interface MonthlyStats {
  year: number
  month: number // 1-12
  monthLabel: string // "Januari 2026"
  totalReadings: number
  averageSystolic: number
  averageDiastolic: number
  averagePulse: number | null
  highestSystolic: number
  highestDiastolic: number
  lowestSystolic: number
  lowestDiastolic: number
  categoryBreakdown: Record<BloodPressureCategory, number>
  daysTracked: number
}

/**
 * Trend comparison between two periods.
 */
export interface TrendComparison {
  current: {
    startDate: string
    endDate: string
    averageSystolic: number
    averageDiastolic: number
    readingCount: number
  }
  previous: {
    startDate: string
    endDate: string
    averageSystolic: number
    averageDiastolic: number
    readingCount: number
  }
  systolicChange: number // delta current - previous
  diastolicChange: number
  systolicTrend: 'up' | 'down' | 'stable'
  diastolicTrend: 'up' | 'down' | 'stable'
}

/**
 * Data point for the 30-day chart.
 * If there is no reading on a day, all values are null.
 */
export interface DailyPoint {
  date: string // ISO yyyy-MM-dd
  label: string // "16 Jun"
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  count: number
}

/**
 * Distribution of categories within a period.
 */
export interface CategoryDistribution {
  total: number
  items: Array<{
    category: BloodPressureCategory
    count: number
    percentage: number
  }>
}

/**
 * Get monthly aggregate statistics for a specific month.
 * If year/month is omitted, defaults to the current month.
 */
export async function getMonthlyStats(
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth() + 1 // 1-12

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0)
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', startOfMonth.toISOString())
    .lte('measured_at', endOfMonth.toISOString())
    .order('measured_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly stats:', error)
    throw new Error('Gagal memuat statistik bulanan')
  }

  if (!data || data.length === 0) {
    return null
  }

  const totalReadings = data.length
  const sumSystolic = data.reduce((acc, r) => acc + r.systolic, 0)
  const sumDiastolic = data.reduce((acc, r) => acc + r.diastolic, 0)
  const pulseValues = data
    .map((r) => r.pulse)
    .filter((p): p is number => typeof p === 'number')
  const avgPulse =
    pulseValues.length > 0
      ? Math.round(pulseValues.reduce((acc, p) => acc + p, 0) / pulseValues.length)
      : null

  const highestSystolic = Math.max(...data.map((r) => r.systolic))
  const highestDiastolic = Math.max(...data.map((r) => r.diastolic))
  const lowestSystolic = Math.min(...data.map((r) => r.systolic))
  const lowestDiastolic = Math.min(...data.map((r) => r.diastolic))

  // Distinct days tracked
  const uniqueDays = new Set(
    data.map((r) => new Date(r.measured_at).toISOString().slice(0, 10))
  )

  // Recalculate category from raw values to ensure data integrity
  const categoryBreakdown: Record<BloodPressureCategory, number> = {
    low: 0,
    normal: 0,
    elevated: 0,
    hypertension_stage_1: 0,
    hypertension_stage_2: 0,
  }
  for (const r of data) {
    const cat = calculateCategory(r.systolic, r.diastolic)
    categoryBreakdown[cat]++
  }

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  const monthLabel = `${monthNames[targetMonth - 1]} ${targetYear}`

  return {
    year: targetYear,
    month: targetMonth,
    monthLabel,
    totalReadings,
    averageSystolic: Math.round(sumSystolic / totalReadings),
    averageDiastolic: Math.round(sumDiastolic / totalReadings),
    averagePulse: avgPulse,
    highestSystolic,
    highestDiastolic,
    lowestSystolic,
    lowestDiastolic,
    categoryBreakdown,
    daysTracked: uniqueDays.size,
  }
}

/**
 * Get category distribution for the last `days` days.
 * Defaults to 30 days.
 */
export async function getCategoryStats(days: number = 30): Promise<CategoryDistribution> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('systolic, diastolic, category')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', startDate.toISOString())

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

  for (const r of data ?? []) {
    // Recalculate category from raw values to avoid stale data
    const cat = calculateCategory(r.systolic, r.diastolic)
    counts[cat]++
  }

  // Define order: most severe first
  const order: BloodPressureCategory[] = [
    'hypertension_stage_2',
    'hypertension_stage_1',
    'elevated',
    'normal',
    'low',
  ]

  const items = order.map((category) => ({
    category,
    count: counts[category],
    percentage: total > 0 ? (counts[category] / total) * 100 : 0,
  }))

  return { total, items }
}

/**
 * Compare two periods of equal length. Defaults to the last 30 days
 * compared to the 30 days before that.
 */
export async function getTrendComparison(
  periodDays: number = 30
): Promise<TrendComparison> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const currentEnd = now
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - periodDays)
  currentStart.setHours(0, 0, 0, 0)

  const previousEnd = new Date(currentStart)
  previousEnd.setMilliseconds(-1)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - periodDays)
  previousStart.setHours(0, 0, 0, 0)

  async function fetchRange(start: Date, end: Date) {
    return supabase
      .from('blood_pressure_records')
      .select('systolic, diastolic')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .gte('measured_at', start.toISOString())
      .lte('measured_at', end.toISOString())
  }

  const [{ data: currentData }, { data: previousData }] = await Promise.all([
    fetchRange(currentStart, currentEnd),
    fetchRange(previousStart, previousEnd),
  ])

  function summarize(rows: { systolic: number; diastolic: number }[] | null) {
    if (!rows || rows.length === 0) {
      return {
        averageSystolic: 0,
        averageDiastolic: 0,
        readingCount: 0,
      }
    }
    const sumS = rows.reduce((acc, r) => acc + r.systolic, 0)
    const sumD = rows.reduce((acc, r) => acc + r.diastolic, 0)
    return {
      averageSystolic: Math.round(sumS / rows.length),
      averageDiastolic: Math.round(sumD / rows.length),
      readingCount: rows.length,
    }
  }

  const current = summarize(currentData)
  const previous = summarize(previousData)

  const systolicChange = current.averageSystolic - previous.averageSystolic
  const diastolicChange = current.averageDiastolic - previous.averageDiastolic

  return {
    current: {
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
      ...current,
    },
    previous: {
      startDate: previousStart.toISOString(),
      endDate: previousEnd.toISOString(),
      ...previous,
    },
    systolicChange,
    diastolicChange,
    systolicTrend: classifyTrend(systolicChange),
    diastolicTrend: classifyTrend(diastolicChange),
  }
}

function classifyTrend(change: number): 'up' | 'down' | 'stable' {
  const threshold = 3
  if (Math.abs(change) < threshold) return 'stable'
  return change > 0 ? 'up' : 'down'
}

/**
 * Get daily aggregated points for the last `days` days.
 * Returns one entry per day even when no reading is present (filled with nulls).
 */
export async function get30DayChartData(days: number = 30): Promise<DailyPoint[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', startDate.toISOString())
    .lte('measured_at', endDate.toISOString())
    .order('measured_at', { ascending: true })

  if (error) {
    console.error('Error fetching chart data:', error)
    throw new Error('Gagal memuat data grafik')
  }

  // Group readings by local date key (yyyy-MM-dd)
  const buckets = new Map<
    string,
    {
      systolicSum: number
      diastolicSum: number
      pulseSum: number
      pulseCount: number
      count: number
    }
  >()

  for (const r of data ?? []) {
    const key = localDateKey(new Date(r.measured_at))
    const existing = buckets.get(key) ?? {
      systolicSum: 0,
      diastolicSum: 0,
      pulseSum: 0,
      pulseCount: 0,
      count: 0,
    }
    existing.systolicSum += r.systolic
    existing.diastolicSum += r.diastolic
    existing.count += 1
    if (typeof r.pulse === 'number') {
      existing.pulseSum += r.pulse
      existing.pulseCount += 1
    }
    buckets.set(key, existing)
  }

  // Build one entry per day for the requested range
  const result: DailyPoint[] = []
  const cursor = new Date(startDate)
  for (let i = 0; i < days; i++) {
    const key = localDateKey(cursor)
    const bucket = buckets.get(key)
    result.push({
      date: key,
      label: formatChartLabel(cursor),
      systolic: bucket ? Math.round(bucket.systolicSum / bucket.count) : null,
      diastolic: bucket ? Math.round(bucket.diastolicSum / bucket.count) : null,
      pulse:
        bucket && bucket.pulseCount > 0
          ? Math.round(bucket.pulseSum / bucket.pulseCount)
          : null,
      count: bucket?.count ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function localDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatChartLabel(d: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ]
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export type { BloodPressureRecord }
