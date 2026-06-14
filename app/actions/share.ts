'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

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

export async function validateShareToken(token: string) {
  const supabase = createAdminClient()

  // Get token without authentication
  const { data: shareToken, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !shareToken) {
    return { error: 'Invalid or expired token', data: null }
  }

  // Check if expired
  if (shareToken.expires_at) {
    const expiresAt = new Date(shareToken.expires_at)
    if (expiresAt < new Date()) {
      // Deactivate expired token
      await supabase
        .from('share_tokens')
        .update({ is_active: false })
        .eq('id', shareToken.id)

      return { error: 'Token has expired', data: null }
    }
  }

  // Check max views
  if (shareToken.max_views && shareToken.view_count >= shareToken.max_views) {
    return { error: 'Token has reached maximum views', data: null }
  }

  // Increment view count
  await supabase
    .from('share_tokens')
    .update({ view_count: shareToken.view_count + 1 })
    .eq('id', shareToken.id)

  return { data: shareToken }
}

export interface ShareRecordsResult {
  error: string | null
  data: Array<{
    id: string
    user_id: string
    systolic: number
    diastolic: number
    pulse: number | null
    category: 'low' | 'normal' | 'elevated' | 'hypertension_stage_1' | 'hypertension_stage_2'
    notes: string | null
    measured_at: string
    created_at: string
    updated_at: string
    deleted_at: string | null
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getRecordsByShareToken(
  token: string,
  options: { page?: number; pageSize?: number; startDate?: string; endDate?: string } = {}
): Promise<ShareRecordsResult> {
  const supabase = createAdminClient()

  // Validate token first
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

  if (options.startDate) {
    const start = new Date(options.startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('measured_at', start.toISOString())
  }

  if (options.endDate) {
    const end = new Date(options.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('measured_at', end.toISOString())
  }

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
    data: (records || []) as ShareRecordsResult['data'],
    total,
    page,
    pageSize,
    totalPages,
  }
}
