import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetch the 7-day blood pressure records for a user.
 *
 * Wrapped in React.cache() so that multiple server components calling this
 * during the same render pass share a single Supabase query — no duplicate
 * round-trips.
 */
export const getWeeklyRecords = cache(async (userId: string) => {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('measured_at', sevenDaysAgo.toISOString())
    .order('measured_at', { ascending: true })

  return (data ?? []) as Array<{
    id: string
    systolic: number
    diastolic: number
    pulse: number | null
    measured_at: string
    notes: string | null
    category: string
    created_at: string
  }>
})
