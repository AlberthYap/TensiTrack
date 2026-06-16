'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'
import { applyDateRange } from '@/lib/supabase/queries'
import { BloodPressureRecord, PaginatedRecords } from '@/types/blood-pressure.types'

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

export async function getRecordsByShareToken(
  token: string,
  options: { page?: number; pageSize?: number; startDate?: string; endDate?: string } = {}
): Promise<PaginatedRecords & { error: string | null }> {
  const supabase = createAdminClient()

  // Validate token first (atomic via RPC)
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

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('blood_pressure_records')
    .select('*', { count: 'exact' })
    .eq('user_id', shareToken.user_id)
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
