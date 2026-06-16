'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bloodPressureSchema } from '@/lib/validations'
import { calculateCategory } from '@/lib/blood-pressure'

export async function addBloodPressureRecord(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
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
      error: validatedFields.error.errors[0].message,
    }
  }

  const { systolic, diastolic, pulse, notes, measured_at } = validatedFields.data

  // Calculate category
  const category = calculateCategory(systolic, diastolic)

  // Insert record
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
      error: validatedFields.error.errors[0].message,
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

export async function getBloodPressureRecords() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })

  if (error) {
    return []
  }

  return data
}

export interface GetRecordsOptions {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
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
    // awal hari dalam ISO (lokal)
    const start = new Date(options.startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('measured_at', start.toISOString())
  }

  if (options.endDate) {
    const end = new Date(options.endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('measured_at', end.toISOString())
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
