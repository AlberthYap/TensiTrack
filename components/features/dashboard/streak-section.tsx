import { createClient } from '@/lib/supabase/server'
import { StreakCard } from './streak-card'
import {
  addAppDateDays,
  differenceAppDateDays,
  getAppDateKey,
  getAppDayStartUtc,
} from '@/lib/timezone'

/** Count consecutive days (back from today) with at least one reading. */
function computeStreak(records: Array<{ measured_at: string }>): number {
  const dates = new Set(records.map((r) => getAppDateKey(r.measured_at)))
  let streak = 0
  const today = getAppDateKey()
  for (let i = 0; i < 365; i++) {
    if (dates.has(addAppDateDays(today, -i))) streak++
    else break
  }
  return streak
}

function computeDaysSinceLastReading(records: Array<{ measured_at: string }>): number {
  if (records.length === 0) return 999
  return differenceAppDateDays(getAppDateKey(), getAppDateKey(records[0].measured_at))
}

interface StreakSectionProps {
  userId: string
}

export async function StreakSection({ userId }: StreakSectionProps) {
  const supabase = await createClient()

  const oneYearAgo = getAppDayStartUtc(addAppDateDays(getAppDateKey(), -365))

  const { data: streakRecords } = await supabase
    .from('blood_pressure_records')
    .select('measured_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('measured_at', oneYearAgo)
    .order('measured_at', { ascending: false })

  const streak = computeStreak(streakRecords ?? [])
  const daysSinceLastReading = computeDaysSinceLastReading(streakRecords ?? [])

  if (streakRecords && streakRecords.length === 0) return null

  return <StreakCard streak={streak} daysSinceLastReading={daysSinceLastReading} />
}
