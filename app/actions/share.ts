'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'
import { checkDemoRateLimit, isDemoEmail, DEMO_MUTATE_LOCKOUT_MESSAGE } from '@/lib/demo'
import { getClientIp as getRateLimitClientIp } from '@/lib/rate-limit'
import { PaginatedRecords, MonthlyStats, DailyPoint, CategoryDistribution, TrendComparison } from '@/types/blood-pressure.types'
import {
  getRecordsByUserId,
  getMonthlyStatsByUserId,
  get30DayChartDataByUserId,
  getCategoryStatsByUserId,
  getTrendComparisonByUserId,
} from '@/lib/share-internal-queries'

// SECURITY: helpers in lib/share-internal-queries.ts do NOT use 'use server'
// directive, so they are not exposed as public Server Actions.

// Anti-abuse rate limit for validateShareToken.
const SHARE_RATE_LIMIT_MAX = 30
const SHARE_RATE_LIMIT_WINDOW_SECONDS = 60

async function getClientIp(): Promise<string> {
  return getRateLimitClientIp()
}

export async function generateShareToken(expiresInDays?: number | null, maxViews?: number | null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'share')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
  }

  const token = nanoid(32)

  let expiresAt: string | null = null
  if (expiresInDays && expiresInDays > 0) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + expiresInDays)
    expiresAt = expDate.toISOString()
  }

  // For demo users: use atomic RPC (hard cap check + insert in one DB
  // transaction) to eliminate the race condition. The RPC is granted only to
  // service_role, so it must be called via the admin client; otherwise demo
  // credentials (public) could bypass the per-IP rate limit.
  if (isDemoEmail(user.email)) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('generateShareToken: SUPABASE_SERVICE_ROLE_KEY is not set')
      return { error: 'Konfigurasi server tidak lengkap. Silakan coba lagi nanti.' }
    }
    const adminClient = createAdminClient()
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'create_share_token_atomic',
      {
        p_user_id: user.id,
        p_token: token,
        p_expires_at: expiresAt,
        p_max_views: maxViews ?? null,
      }
    )

    if (rpcError) {
      console.error('Atomic share token RPC error:', rpcError)
      return { error: rpcError.message }
    }

    if (rpcResult?.error) {
      return { error: rpcResult.error }
    }

    revalidatePath('/records')
    return { data: rpcResult, token }
  }

  // Regular user — use standard Supabase insert
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'share')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'share')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
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

export type ShareTokenStatus = 'ok' | 'not_found' | 'inactive' | 'expired' | 'max_views_reached'

/**
 * Atomic token validation + view_count increment via RPC.
 * Use this on the public share page; internal getters use resolveShareToken
 * so multiple chart/table lookups don't consume max_views.
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

  // Rate limit per IP — fail-open so legitimate users don't fail when RPC is down.
  try {
    const ip = await getClientIp()
    const { data: rateAllowed, error: rateError } = await supabase.rpc(
      'check_share_rate_limit',
      {
        p_ip: ip,
        p_max_count: SHARE_RATE_LIMIT_MAX,
        p_window_seconds: SHARE_RATE_LIMIT_WINDOW_SECONDS,
      }
    )
    if (rateError) {
      console.error('Share rate limit check failed (fail-open):', rateError)
    } else if (rateAllowed === false) {
      return {
        error: 'Terlalu banyak permintaan. Coba lagi nanti.',
        data: null,
      }
    }
  } catch (err) {
    console.error('Share rate limit threw (fail-open):', err)
  }

  const { data, error } = await supabase.rpc('increment_share_token_view', {
    p_token: token,
  })

  if (error) {
    // Legacy fallback if RPC doesn't exist yet (migration not applied).
    if (error.code === 'PGRST202' || error.message.includes('function')) {
      return legacyValidateShareToken(token)
    }
    return { error: error.message, data: null }
  }

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

async function resolveShareUserId(token: string): Promise<{ userId: string } | null> {
  const { data: shareToken, error } = await resolveShareToken(token)
  if (error || !shareToken) {
    return null
  }
  return { userId: shareToken.user_id }
}

/**
 * Validate token without incrementing view_count. Used by internal getters
 * so multiple chart/table lookups don't consume max_views.
 */
async function resolveShareToken(token: string): Promise<{
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

  const { data: shareToken, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !shareToken) {
    return { error: 'Invalid or expired token', data: null }
  }

  if (!shareToken.is_active) {
    return { error: 'Token sudah tidak aktif', data: null }
  }

  if (shareToken.expires_at) {
    const expiresAt = new Date(shareToken.expires_at)
    if (expiresAt < new Date()) {
      return { error: 'Token has expired', data: null }
    }
  }

  if (shareToken.max_views && shareToken.view_count >= shareToken.max_views) {
    return { error: 'Token has reached maximum views', data: null }
  }

  return {
    error: null,
    data: {
      id: shareToken.id,
      user_id: shareToken.user_id,
      token: shareToken.token,
      expires_at: shareToken.expires_at,
      is_active: shareToken.is_active,
      view_count: shareToken.view_count,
      max_views: shareToken.max_views,
      created_at: shareToken.created_at,
      updated_at: shareToken.updated_at,
    },
  }
}

// Each *ByShareToken validates the token without incrementing view_count
// (via resolveShareToken) then delegates to *ByUserId. Fail-soft per return type.

export async function getRecordsByShareToken(
  token: string,
  options: { page?: number; pageSize?: number; startDate?: string; endDate?: string } = {}
): Promise<PaginatedRecords & { error: string | null }> {
  const { data: shareToken, error: tokenError } = await resolveShareToken(token)
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

export async function getMonthlyStatsByShareToken(
  token: string,
  year?: number,
  month?: number
): Promise<MonthlyStats | null> {
  const resolved = await resolveShareUserId(token)
  if (!resolved) return null
  return getMonthlyStatsByUserId(resolved.userId, year, month)
}

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
    current: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    previous: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    systolicChange: 0,
    diastolicChange: 0,
    systolicTrend: 'stable',
    diastolicTrend: 'stable',
  }
}
