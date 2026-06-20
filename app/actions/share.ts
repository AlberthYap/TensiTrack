'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'
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

export async function generateShareToken(expiresInDays?: number | null, maxViews?: number | null) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Generate unique token
  const token = nanoid(32)

  // Calculate expiration date if provided
  let expiresAt = null
  if (expiresInDays && expiresInDays > 0) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + expiresInDays)
    expiresAt = expDate.toISOString()
  }

  // Insert share token
  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      max_views: maxViews,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/records')
  return { data, token }
}

export async function getShareTokens() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized', data: [] }
  }

  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}

export async function revokeShareToken(tokenId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('share_tokens')
    .update({ is_active: false })
    .eq('id', tokenId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/records')
  return { success: true }
}

export async function deleteShareToken(tokenId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('share_tokens')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/records')
  return { success: true }
}

/**
 * Status hasil increment atomik.
 */
export type ShareTokenStatus = 'ok' | 'not_found' | 'inactive' | 'expired' | 'max_views_reached'

/**
 * Validasi share token DAN increment view_count secara atomic via RPC.
 *
 * Sebelumnya, validasi + increment dilakukan read-modify-write di aplikasi
 * sehingga rentan race condition. Sekarang diserahkan ke Postgres dengan
 * row-level lock (FOR UPDATE) sehingga dijamin atomic.
 *
 * Mengembalikan null `data` dan `error` non-null bila token invalid/expired/
 * max_views_reached.
 *
 * PENTING: Fungsi ini meng-increment view_count. Panggil SEKALI per request
 * (mis. di share page atau export route). Untuk mengambil data tambahan
 * setelah token divalidasi, gunakan fungsi `*ByUserId` yang menerima
 * `user_id` langsung — agar view_count tidak di-increment berulang kali.
 */
export async function validateShareToken(token: string): Promise<{
  error: string | null
  data: {
    id: string
    user_id: string
    token: string
    expires_at: string | null
    is_active: boolean
    view_count: number
    max_views: number | null
    created_at: string
    updated_at: string
  } | null
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('increment_share_token_view', {
    p_token: token,
  })

  if (error) {
    // Jika RPC belum ada (migration belum dijalankan), fallback ke logic lama
    if (error.code === 'PGRST202' || error.message.includes('function')) {
      return legacyValidateShareToken(token)
    }
    return { error: error.message, data: null }
  }

  // RPC mengembalikan array; ambil baris pertama
  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return { error: 'Invalid token', data: null }
  }

  const status: ShareTokenStatus = row.status
  if (status === 'not_found') {
    return { error: 'Invalid or expired token', data: null }
  }
  if (status === 'inactive') {
    return { error: 'Token sudah tidak aktif', data: null }
  }
  if (status === 'expired') {
    return { error: 'Token has expired', data: null }
  }
  if (status === 'max_views_reached') {
    return { error: 'Token has reached maximum views', data: null }
  }

  return {
    error: null,
    data: {
      id: row.id,
      user_id: row.user_id,
      token: row.token,
      expires_at: row.expires_at,
      is_active: row.is_active,
      view_count: row.view_count,
      max_views: row.max_views,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  }
}

/**
 * Fallback implementation bila RPC `increment_share_token_view` belum
 * tersedia (mis. migration belum dijalankan). TIDAK atomic, hanya untuk
 * backward compat.
 */
async function legacyValidateShareToken(token: string) {
  const supabase = createAdminClient()

  const { data: shareToken, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !shareToken) {
    return { error: 'Invalid or expired token', data: null }
  }

  if (shareToken.expires_at) {
    const expiresAt = new Date(shareToken.expires_at)
    if (expiresAt < new Date()) {
      await supabase
        .from('share_tokens')
        .update({ is_active: false })
        .eq('id', shareToken.id)
      return { error: 'Token has expired', data: null }
    }
  }

  if (shareToken.max_views && shareToken.view_count >= shareToken.max_views) {
    return { error: 'Token has reached maximum views', data: null }
  }

  await supabase
    .from('share_tokens')
    .update({ view_count: shareToken.view_count + 1 })
    .eq('id', shareToken.id)

  return { error: null, data: shareToken }
}

/**
 * Ambil record tekanan darah berdasarkan user_id (tanpa validasi token).
 *
 * Dipakai oleh share page SETELAH token divalidasi sekali (increment
 * view_count) agar tidak terjadi multi-increment view_count. Fungsi ini
 * TIDAK memvalidasi token dan TIDAK meng-increment view_count.
 */
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

/**
 * Ambil record via share token. Memvalidasi token (atomic, increment
 * view_count) lalu mendelegasikan ke `getRecordsByUserId`.
 *
 * Gunakan ini untuk akses standalone (1 panggilan = 1 view). Untuk share
 * page yang mengambil banyak data sekaligus, validasi token sekali lalu
 * panggil `getRecordsByUserId` langsung.
 */
export async function getRecordsByShareToken(
  token: string,
  options: { page?: number; pageSize?: number; startDate?: string; endDate?: string } = {}
): Promise<PaginatedRecords & { error: string | null }> {
  // Validate token first (atomic via RPC, increments view_count)
  const { data: shareToken, error: tokenError } = await validateShareToken(token)

  if (tokenError || !shareToken) {
    return {
      error: tokenError || 'Invalid token',
      data: [],
      total: 0,
      page: 1,
      pageSize: options.pageSize ?? 10,
      totalPages: 1,
    }
  }

  return getRecordsByUserId(shareToken.user_id, options)
}

/**
 * Agregat bulanan berdasarkan user_id (tanpa validasi token).
 *
 * Dipakai oleh share page SETELAH token divalidasi sekali agar view_count
 * tidak di-increment berulang. TIDAK memvalidasi token dan TIDAK
 * meng-increment view_count.
 *
 * Return `null` bila bulan tersebut tidak memiliki catatan, atau bila query
 * gagal — sehingga halaman share tidak pernah crash karena analitik.
 */
export async function getMonthlyStatsByUserId(
  userId: string,
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  try {
    const supabase = createAdminClient()

    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? now.getMonth() + 1 // 1-12

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0)
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', startOfMonth.toISOString())
      .lte('measured_at', endOfMonth.toISOString())
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
      data.map((r) => new Date(r.measured_at).toISOString().slice(0, 10))
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
  } catch (err) {
    // Fail-soft: never break the share page because of analytics.
    console.error('getMonthlyStatsByUserId failed:', err)
    return null
  }
}

/**
 * Agregat bulanan untuk pemilik data share token (read-only).
 *
 * Memvalidasi token (atomic, increment view_count) lalu mendelegasikan ke
 * `getMonthlyStatsByUserId`. Untuk share page, gunakan `getMonthlyStatsByUserId`
 * langsung setelah token divalidasi sekali.
 */
export async function getMonthlyStatsByShareToken(
  token: string,
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  // Validate token (atomic via RPC, increments view_count)
  const { data: shareToken, error: tokenError } = await validateShareToken(token)
  if (tokenError || !shareToken) {
    return null
  }

  return getMonthlyStatsByUserId(shareToken.user_id, year, month)
}

/**
 * Helper internal: validasi share token dan kembalikan `user_id` pemilik
 * data, atau `null` bila token invalid/expired/max-views.
 *
 * Memvalidasi token (atomic, increment view_count). Dipakai oleh fungsi
 * `*ByShareToken` untuk akses standalone.
 */
async function resolveShareUserId(
  token: string
): Promise<{ userId: string } | null> {
  const { data: shareToken, error } = await validateShareToken(token)
  if (error || !shareToken) {
    return null
  }
  return { userId: shareToken.user_id }
}

/**
 * Agregat harian berdasarkan user_id (tanpa validasi token).
 *
 * Dipakai oleh share page SETELAH token divalidasi sekali agar view_count
 * tidak di-increment berulang. TIDAK memvalidasi token dan TIDAK
 * meng-increment view_count.
 *
 * Fail-soft: kembalikan `[]` bila query error, atau tidak ada catatan —
 * sehingga halaman share tidak pernah crash.
 */
export async function get30DayChartDataByUserId(
  userId: string,
  days: number = 30
): Promise<DailyPoint[]> {
  try {
    const supabase = createAdminClient()
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', startDate.toISOString())
      .lte('measured_at', endDate.toISOString())
      .order('measured_at', { ascending: true })

    if (error) {
      console.error('Error fetching share 30-day chart:', error)
      return []
    }

    // Bucket per tanggal lokal (yyyy-MM-dd)
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

    const result: DailyPoint[] = []
    const cursor = new Date(startDate)
    for (let i = 0; i < days; i++) {
      const key = localDateKey(cursor)
      const bucket = buckets.get(key)
      result.push({
        date: key,
        label: formatChartLabel(cursor),
        systolic: bucket ? Math.round(bucket.systolicSum / bucket.count) : null,
        diastolic: bucket
          ? Math.round(bucket.diastolicSum / bucket.count)
          : null,
        pulse:
          bucket && bucket.pulseCount > 0
            ? Math.round(bucket.pulseSum / bucket.pulseCount)
            : null,
        count: bucket?.count ?? 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return result
  } catch (err) {
    console.error('get30DayChartDataByUserId failed:', err)
    return []
  }
}

/**
 * Agregat harian untuk share page (default: 30 hari).
 * Memvalidasi token (atomic, increment view_count) lalu mendelegasikan ke
 * `get30DayChartDataByUserId`.
 *
 * Fail-soft: kembalikan `[]` bila token invalid, query error, atau tidak
 * ada catatan — sehingga halaman share tidak pernah crash.
 */
export async function get30DayChartDataByShareToken(
  token: string,
  days: number = 30
): Promise<DailyPoint[]> {
  try {
    const resolved = await resolveShareUserId(token)
    if (!resolved) return []

    return get30DayChartDataByUserId(resolved.userId, days)
  } catch (err) {
    console.error('get30DayChartDataByShareToken failed:', err)
    return []
  }
}

/**
 * Distribusi kategori berdasarkan user_id (tanpa validasi token).
 *
 * Dipakai oleh share page SETELAH token divalidasi sekali agar view_count
 * tidak di-increment berulang. TIDAK memvalidasi token dan TIDAK
 * meng-increment view_count.
 *
 * Fail-soft: kembalikan `{ total: 0, items: [] }` saat error.
 */
export async function getCategoryStatsByUserId(
  userId: string,
  days: number = 30
): Promise<CategoryDistribution> {
  try {
    const supabase = createAdminClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('blood_pressure_records')
      .select('systolic, diastolic, category')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('measured_at', startDate.toISOString())

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
      // Recalculate kategori dari nilai mentah untuk konsistensi
      const cat = calculateCategory(r.systolic, r.diastolic)
      counts[cat]++
    }

    // Urutan: paling parah duluan
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

/**
 * Distribusi kategori untuk share page (default: 30 hari).
 * Memvalidasi token (atomic, increment view_count) lalu mendelegasikan ke
 * `getCategoryStatsByUserId`.
 *
 * Fail-soft: kembalikan `{ total: 0, items: [] }` saat token invalid / error.
 */
export async function getCategoryStatsByShareToken(
  token: string,
  days: number = 30
): Promise<CategoryDistribution> {
  try {
    const resolved = await resolveShareUserId(token)
    if (!resolved) return { total: 0, items: [] }

    return getCategoryStatsByUserId(resolved.userId, days)
  } catch (err) {
    console.error('getCategoryStatsByShareToken failed:', err)
    return { total: 0, items: [] }
  }
}

/**
 * Perbandingan dua periode berdasarkan user_id (tanpa validasi token).
 *
 * Dipakai oleh share page SETELAH token divalidasi sekali agar view_count
 * tidak di-increment berulang. TIDAK memvalidasi token dan TIDAK
 * meng-increment view_count.
 *
 * Fail-soft: kembalikan struktur nol saat error.
 */
export async function getTrendComparisonByUserId(
  userId: string,
  periodDays: number = 30
): Promise<TrendComparison> {
  try {
    const supabase = createAdminClient()

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

    const fetchRange = async (start: Date, end: Date) => {
      return supabase
        .from('blood_pressure_records')
        .select('systolic, diastolic')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('measured_at', start.toISOString())
        .lte('measured_at', end.toISOString())
    }

    const [{ data: currentData }, { data: previousData }] = await Promise.all([
      fetchRange(currentStart, currentEnd),
      fetchRange(previousStart, previousEnd),
    ])

    const summarize = (rows: { systolic: number; diastolic: number }[] | null) => {
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
  } catch (err) {
    console.error('getTrendComparisonByUserId failed:', err)
    return emptyTrendComparison(periodDays)
  }
}

/**
 * Perbandingan dua periode (default: 30 hari vs 30 hari sebelumnya)
 * untuk share page. Memvalidasi token (atomic, increment view_count) lalu
 * mendelegasikan ke `getTrendComparisonByUserId`.
 *
 * Fail-soft: kembalikan struktur nol saat token invalid / error.
 */
export async function getTrendComparisonByShareToken(
  token: string,
  periodDays: number = 30
): Promise<TrendComparison> {
  try {
    const resolved = await resolveShareUserId(token)
    if (!resolved) return emptyTrendComparison(periodDays)

    return getTrendComparisonByUserId(resolved.userId, periodDays)
  } catch (err) {
    console.error('getTrendComparisonByShareToken failed:', err)
    return emptyTrendComparison(periodDays)
  }
}

function emptyTrendComparison(periodDays: number): TrendComparison {
  return {
    current: {
      startDate: '',
      endDate: '',
      averageSystolic: 0,
      averageDiastolic: 0,
      readingCount: 0,
    },
    previous: {
      startDate: '',
      endDate: '',
      averageSystolic: 0,
      averageDiastolic: 0,
      readingCount: 0,
    },
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
