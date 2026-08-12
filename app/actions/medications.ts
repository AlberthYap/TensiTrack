'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkDemoRateLimit } from '@/lib/demo'
import { getAppTodayKey } from '@/lib/timezone'

export interface MedicationEntry {
  id: string
  user_id: string
  name: string
  dosage: string | null
  taken: boolean
  taken_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

const medicationSchema = z.object({
  name: z.string().min(1, 'Nama obat harus diisi').max(100),
  dosage: z.string().max(50).optional().nullable(),
  notes: z.string().max(200).optional().nullable(),
})

/** Today's date stamp computed at call time to avoid stale module-level values. */
function today(): string {
  return getAppTodayKey()
}

export async function addMedication(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'medication')
  if (rateLimitResult.error) return { error: rateLimitResult.error }

  const validated = medicationSchema.safeParse({
    name: formData.get('name'),
    dosage: formData.get('dosage') || null,
    notes: formData.get('notes') || null,
  })
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { name, dosage, notes } = validated.data

  const { error } = await supabase.from('medications').insert({
    user_id: user.id,
    name,
    dosage: dosage || null,
    notes: notes || null,
    taken_date: today(),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleMedication(id: string, taken: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'medication')
  if (rateLimitResult.error) return { error: rateLimitResult.error }

  const { error } = await supabase
    .from('medications')
    .update({ taken })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteMedication(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Rate limit demo user mutations by IP
  const rateLimitResult = await checkDemoRateLimit(user.email, 'medication')
  if (rateLimitResult.error) return { error: rateLimitResult.error }

  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getTodayMedications(): Promise<{ data: MedicationEntry[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user.id)
    .eq('taken_date', today())
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data || []) as MedicationEntry[] }
}
