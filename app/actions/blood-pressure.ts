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
  return { success: true }
}

export async function getBloodPressureRecord(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    return null
  }

  return data
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
