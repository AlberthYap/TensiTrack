import { createAdminClient } from '@/lib/supabase/admin'
import { applyDateRange } from '@/lib/supabase/queries'
import {
  BloodPressureRecord,
  BloodPressureCategory,
  PaginatedRecords,
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

// SECURITY: this file has no 'use server' directive, so exported functions
// are NOT public Server Action endpoints. Callers MUST validate the share
// token first (see `validateShareToken` in app/actions/share.ts) and pass
// the resolved user_id. Do not re-export these from any 'use server' file.

export async function getRecordsByUserId(
  userId: string,
  options: { page?: number; pageSize?: number; startDate?: string; endDate?: string } = {}
): Promise<PaginatedRecords & { error: string | null }> {
  const supabase = createAdminClient()

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('blood_pressure_records')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)

  query = applyDateRange(query, options)

  const { data: records, error, count } = await query
    .order('measured_at', { ascending: false })
    .range(from, to)

  if (error) {
    return {
      error: error.message,
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    error: null,
    data: (records || []) as BloodPressureRecord[],
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getMonthlyStatsByUserId(
  userId: string,
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  try {
    const supabase = createAdminClient()

    const [currentYear, currentMonth] = getAppDateKey().split('-').map(Number)
    const targetYear = year ?? currentYear
    const targetMonth = month ?? currentMonth
    const monthRange = getAppMonthRangeUtc(targetYear, targetMonth)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', monthRange.start)
      .lte('measured_at', monthRange.end)
      .order('measured_at', { ascending: true })

    if (error) {
      console.error('Error fetching share monthly stats:', error)
      return null
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

    const uniqueDays = new Set(
      data.map((r) => getAppDateKey(r.measured_at))
    )

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
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
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
  } catch (err) {
    console.error('getMonthlyStatsByUserId failed:', err)
    return null
  }
}

export async function get30DayChartDataByUserId(
  userId: string,
  days: number = 30
): Promise<DailyPoint[]> {
  try {
    const supabase = createAdminClient()
    const range = getAppRollingRangeUtc(days)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', range.start)
      .lte('measured_at', range.end)
      .order('measured_at', { ascending: true })

    if (error) {
      console.error('Error fetching share 30-day chart:', error)
      return []
    }

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
      const key = getAppDateKey(r.measured_at)
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

    const result: DailyPoint[] = []
    for (let i = 0; i < days; i++) {
      const key = addAppDateDays(range.startDateKey, i)
      const bucket = buckets.get(key)
      result.push({
        date: key,
        label: formatAppDateKeyLabel(key),
        systolic: bucket ? Math.round(bucket.systolicSum / bucket.count) : null,
        diastolic: bucket ? Math.round(bucket.diastolicSum / bucket.count) : null,
        pulse:
          bucket && bucket.pulseCount > 0
            ? Math.round(bucket.pulseSum / bucket.pulseCount)
            : null,
        count: bucket?.count ?? 0,
      })
    }

    return result
  } catch (err) {
    console.error('get30DayChartDataByUserId failed:', err)
    return []
  }
}

export async function getCategoryStatsByUserId(
  userId: string,
  days: number = 30
): Promise<CategoryDistribution> {
  try {
    const supabase = createAdminClient()
    const range = getAppRollingRangeUtc(days)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('systolic, diastolic, category')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', range.start)

    if (error) {
      console.error('Error fetching share category stats:', error)
      return { total: 0, items: [] }
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
      const cat = calculateCategory(r.systolic, r.diastolic)
      counts[cat]++
    }

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
  } catch (err) {
    console.error('getCategoryStatsByUserId failed:', err)
    return { total: 0, items: [] }
  }
}

export async function getTrendComparisonByUserId(
  userId: string,
  periodDays: number = 30
): Promise<TrendComparison> {
  try {
    const supabase = createAdminClient()

    const ranges = getAppPeriodRangesUtc(periodDays)

    const fetchRange = async (start: string, end: string) => {
      return supabase
        .from('blood_pressure_records')
        .select('systolic, diastolic')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('measured_at', start)
        .lte('measured_at', end)
    }

    const [{ data: currentData }, { data: previousData }] = await Promise.all([
      fetchRange(ranges.current.start, ranges.current.end),
      fetchRange(ranges.previous.start, ranges.previous.end),
    ])

    const summarize = (rows: { systolic: number; diastolic: number }[] | null) => {
      if (!rows || rows.length === 0) {
        return { averageSystolic: 0, averageDiastolic: 0, readingCount: 0 }
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
        startDate: ranges.current.start,
        endDate: ranges.current.end,
        ...current,
      },
      previous: {
        startDate: ranges.previous.start,
        endDate: ranges.previous.end,
        ...previous,
      },
      systolicChange,
      diastolicChange,
      systolicTrend: classifyTrend(systolicChange),
      diastolicTrend: classifyTrend(diastolicChange),
    }
  } catch (err) {
    console.error('getTrendComparisonByUserId failed:', err)
    return emptyTrendComparison(periodDays)
  }
}

export function emptyTrendComparison(periodDays: number): TrendComparison {
  return {
    current: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    previous: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    systolicChange: 0,
    diastolicChange: 0,
    systolicTrend: 'stable',
    diastolicTrend: 'stable',
  }
}

function classifyTrend(change: number): 'up' | 'down' | 'stable' {
  const threshold = 3
  if (Math.abs(change) < threshold) return 'stable'
  return change > 0 ? 'up' : 'down'
}

