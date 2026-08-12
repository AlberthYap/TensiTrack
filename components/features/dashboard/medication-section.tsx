import { createClient } from '@/lib/supabase/server'
import { getAppTodayKey } from '@/lib/timezone'
import { MedicationTracker } from './medication-tracker'

interface MedicationSectionProps {
  userId: string
}

export async function MedicationSection({ userId }: MedicationSectionProps) {
  const supabase = await createClient()

  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .eq('taken_date', getAppTodayKey())
    .order('created_at', { ascending: true })

  return (
    <MedicationTracker
      medications={
        (medications as unknown as Parameters<
          typeof MedicationTracker
        >[0]['medications']) || []
      }
    />
  )
}
