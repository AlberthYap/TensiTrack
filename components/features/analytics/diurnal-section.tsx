import { createClient } from '@/lib/supabase/server'
import { getAppHour, getAppRollingRangeUtc } from '@/lib/timezone'
import { DiurnalCard } from './diurnal-card'

export async function DiurnalSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thirtyDaysAgo = getAppRollingRangeUtc(30).start

  const { data: records } = await supabase
    .from('blood_pressure_records')
    .select('measured_at, systolic, diastolic')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', thirtyDaysAgo)
    .order('measured_at', { ascending: false })

  if (!records || records.length < 2) return null

  const morning = records.filter((r) => {
    const h = getAppHour(r.measured_at)
    return h >= 6 && h <= 11
  })
  const evening = records.filter((r) => {
    const h = getAppHour(r.measured_at)
    return h >= 16 && h <= 21
  })

  const avg = (arr: typeof records, key: 'systolic' | 'diastolic') =>
    arr.length > 0 ? Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length) : 0

  const morningAvg = morning.length >= 2 ? { systolic: avg(morning, 'systolic'), diastolic: avg(morning, 'diastolic') } : null
  const eveningAvg = evening.length >= 2 ? { systolic: avg(evening, 'systolic'), diastolic: avg(evening, 'diastolic') } : null

  return (
    <DiurnalCard
      stats={{
        morningAvg,
        eveningAvg,
        sysDiff: morningAvg && eveningAvg ? eveningAvg.systolic - morningAvg.systolic : 0,
        diaDiff: morningAvg && eveningAvg ? eveningAvg.diastolic - morningAvg.diastolic : 0,
        morningCount: morning.length,
        eveningCount: evening.length,
      }}
    />
  )
}
