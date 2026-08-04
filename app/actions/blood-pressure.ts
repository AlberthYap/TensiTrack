'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bloodPressureSchema } from '@/lib/validations'
import { calculateCategory } from '@/lib/blood-pressure'
import { isDemoEmail, checkDemoRateLimit } from '@/lib/demo'
import type { BloodPressureRecord } from '@/types/blood-pressure.types'

export async function addBloodPressureRecord(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'record')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
  }

  // Validate input
  const validatedFields = bloodPressureSchema.safeParse({
    systolic: Number(formData.get('systolic')),
    diastolic: Number(formData.get('diastolic')),
    pulse: formData.get('pulse') ? Number(formData.get('pulse')) : null,
    notes: formData.get('notes') || null,
    measured_at: formData.get('measured_at'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    }
  }

  const { systolic, diastolic, pulse, notes, measured_at } = validatedFields.data

  // Calculate category
  const category = calculateCategory(systolic, diastolic)

  // For demo users: use atomic RPC (hard cap check + insert in one DB transaction)
  // to eliminate the race condition between count-check and insert. The RPC is
  // granted only to service_role, so it must be called via the admin client;
  // otherwise demo credentials (public) could bypass the per-IP rate limit.
  if (isDemoEmail(user.email)) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('addBloodPressureRecord: SUPABASE_SERVICE_ROLE_KEY is not set')
      return { error: 'Konfigurasi server tidak lengkap. Silakan coba lagi nanti.' }
    }
    const adminClient = createAdminClient()
    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'insert_bp_record_atomic',
      {
        p_user_id: user.id,
        p_systolic: systolic,
        p_diastolic: diastolic,
        p_pulse: pulse ?? null,
        p_category: category,
        p_notes: notes ?? null,
        p_measured_at: measured_at,
      }
    )

    if (rpcError) {
      console.error('Atomic insert RPC error:', rpcError)
      return { error: rpcError.message }
    }

    if (rpcResult?.error) {
      return { error: rpcResult.error }
    }
  } else {
    // Regular user — use standard Supabase insert
    const { error } = await supabase
      .from('blood_pressure_records')
      .insert({
        user_id: user.id,
        systolic,
        diastolic,
        pulse,
        category,
        notes,
        measured_at,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/records')
  redirect('/dashboard')
}

export async function updateBloodPressureRecord(id: string, formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'record')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
  }

  // Validate input
  const validatedFields = bloodPressureSchema.safeParse({
    systolic: Number(formData.get('systolic')),
    diastolic: Number(formData.get('diastolic')),
    pulse: formData.get('pulse') ? Number(formData.get('pulse')) : null,
    notes: formData.get('notes') || null,
    measured_at: formData.get('measured_at'),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    }
  }

  const { systolic, diastolic, pulse, notes, measured_at } = validatedFields.data

  // Calculate category
  const category = calculateCategory(systolic, diastolic)

  // Update record
  const { error } = await supabase
    .from('blood_pressure_records')
    .update({
      systolic,
      diastolic,
      pulse,
      category,
      notes,
      measured_at,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/records')
  revalidatePath('/analytics')
  redirect('/records')
}

export async function deleteBloodPressureRecord(id: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'record')
  if (rateLimitResult.error) {
    return { error: rateLimitResult.error }
  }

  // Soft delete (set deleted_at)
  const { error } = await supabase
    .from('blood_pressure_records')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/records')
  revalidatePath('/analytics')
  return { success: true }
}

export async function getBloodPressureRecords(): Promise<BloodPressureRecord[]> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })

  if (error) {
    return []
  }

  return (data ?? []) as BloodPressureRecord[]
}

export interface GetRecordsOptions {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  category?: string
}

export interface PaginatedRecords {
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

export async function getBloodPressureRecordsPaginated(
  options: GetRecordsOptions = {}
): Promise<{ data: PaginatedRecords | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: 'Unauthorized' }
  }

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 10))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('blood_pressure_records')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (options.startDate) {
    // start of day in ISO (local)
    const start = new Date(options.startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('measured_at', start.toISOString())
  }

  if (options.endDate) {
    const end = new Date(options.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('measured_at', end.toISOString())
  }

  if (options.category && options.category !== 'all') {
    query = query.eq('category', options.category)
  }

  const { data, error, count } = await query
    .order('measured_at', { ascending: false })
    .range(from, to)

  if (error) {
    return { data: null, error: error.message }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    data: {
      data: (data || []) as PaginatedRecords['data'],
      total,
      page,
      pageSize,
      totalPages,
    },
    error: null,
  }
}

export async function getBloodPressureRecordsCount(
  options: Omit<GetRecordsOptions, 'page' | 'pageSize'> = {}
): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  let query = supabase
    .from('blood_pressure_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
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

  const { count } = await query
  return count ?? 0
}

export interface BloodPressureRecordDetail {
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
}

export interface BatchImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

/**
 * Batch import — inserts many records in a single Supabase call.
 * Unlike `addBloodPressureRecord`, this does NOT redirect, so it is
 * safe to call from non-form contexts (e.g. CSV import dialog).
 */
export async function batchImportBloodPressureRecords(
  records: Array<{
    systolic: number
    diastolic: number
    pulse: number | null
    measured_at: string
    notes?: string | null
  }>
): Promise<BatchImportResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: 0, failed: records.length, errors: [{ row: 0, message: 'Unauthorized' }] }
  }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'record')
  if (rateLimitResult.error) {
    return { success: 0, failed: records.length, errors: [{ row: 0, message: rateLimitResult.error }] }
  }

  const validRows: Array<{
    user_id: string
    systolic: number
    diastolic: number
    pulse: number | null
    category: string
    notes: string | null
    measured_at: string
  }> = []

  const errors: Array<{ row: number; message: string }> = []

  for (let i = 0; i < records.length; i++) {
    const r = records[i]
    const validatedFields = bloodPressureSchema.safeParse({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse,
      notes: r.notes || null,
      measured_at: r.measured_at,
    })

    if (!validatedFields.success) {
      errors.push({ row: i + 1, message: validatedFields.error.issues[0].message })
      continue
    }

    const { systolic, diastolic, pulse, notes, measured_at } = validatedFields.data
    const category = calculateCategory(systolic, diastolic)

    validRows.push({
      user_id: user.id,
      systolic,
      diastolic,
      pulse: pulse ?? null,
      category,
      notes: notes ?? null,
      measured_at,
    })
  }

  if (validRows.length === 0) {
    return { success: 0, failed: records.length, errors }
  }

  // For demo users: use atomic batch RPC (hard cap check + insert in one DB
  // transaction) to eliminate the race condition. The RPC is granted only to
  // service_role, so it must be called via the admin client.
  if (isDemoEmail(user.email)) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('batchImportBloodPressureRecords: SUPABASE_SERVICE_ROLE_KEY is not set')
      return { success: 0, failed: records.length, errors: [{ row: 0, message: 'Konfigurasi server tidak lengkap.' }] }
    }
    const adminClient = createAdminClient()
    const recordsJson = validRows.map((r) => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse,
      category: r.category,
      notes: r.notes,
      measured_at: r.measured_at,
    }))

    const { data: rpcResult, error: rpcError } = await adminClient.rpc(
      'batch_insert_bp_records_atomic',
      {
        p_user_id: user.id,
        p_records: recordsJson,
      }
    )

    if (rpcError) {
      console.error('Batch atomic insert RPC error:', rpcError)
      return { success: 0, failed: records.length, errors: [{ row: 0, message: rpcError.message }] }
    }

    if (rpcResult?.error) {
      return { success: 0, failed: records.length, errors: [{ row: 0, message: rpcResult.error }] }
    }
  } else {
    // Regular user — use standard Supabase insert
    const { error } = await supabase
      .from('blood_pressure_records')
      .insert(validRows)

    if (error) {
      return { success: 0, failed: records.length, errors: [{ row: 0, message: error.message }] }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/records')
  revalidatePath('/analytics')

  return {
    success: validRows.length,
    failed: records.length - validRows.length,
    errors,
  }
}

export async function getBloodPressureRecord(
  id: string
): Promise<{ data: BloodPressureRecordDetail | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return { data: null, error: 'Data tidak ditemukan' }
  }

  return { data: data as BloodPressureRecordDetail, error: null }
}
