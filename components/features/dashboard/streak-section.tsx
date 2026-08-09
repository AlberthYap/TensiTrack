import { createClient } from '@/lib/supabase/server'
import { StreakCard } from './streak-card'

/** Count consecutive days (back from today) with at least one reading. */
function computeStreak(records: Array<{ measured_at: string }>): number {
  const dates = new Set(
    records.map((r) => new Date(r.measured_at).toISOString().slice(0, 10))
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) streak++
    else break
  }
  return streak
}

function computeDaysSinceLastReading(records: Array<{ measured_at: string }>): number {
  if (records.length === 0) return 999
  const lastDate = new Date(records[0].measured_at)
  const today = new Date()
  return Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )
}

interface StreakSectionProps {
  userId: string
}

export async function StreakSection({ userId }: StreakSectionProps) {
  const supabase = await createClient()

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: streakRecords } = await supabase
    .from('blood_pressure_records')
    .select('measured_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('measured_at', oneYearAgo.toISOString())
    .order('measured_at', { ascending: false })

  const streak = computeStreak(streakRecords ?? [])
  const daysSinceLastReading = computeDaysSinceLastReading(streakRecords ?? [])

  if (streakRecords && streakRecords.length === 0) return null

  return <StreakCard streak={streak} daysSinceLastReading={daysSinceLastReading} />
}
