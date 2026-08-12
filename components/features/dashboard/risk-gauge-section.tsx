import { createClient } from '@/lib/supabase/server'
import { getTrendComparison } from '@/app/actions/analytics'
import { addAppDateDays, getAppDateKey, getAppDayStartUtc, getAppRollingRangeUtc } from '@/lib/timezone'
import { RiskGauge } from './risk-gauge'

export async function RiskGaugeSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Streak data
  const oneYearAgo = getAppDayStartUtc(addAppDateDays(getAppDateKey(), -365))
  const { data: streakRecords } = await supabase
    .from('blood_pressure_records')
    .select('measured_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', oneYearAgo)
    .order('measured_at', { ascending: false })

  if (!streakRecords || streakRecords.length < 3) return null

  // Compute streak using the same Asia/Jakarta calendar used throughout the app.
  const dates = new Set(streakRecords.map((r) => getAppDateKey(r.measured_at)))
  let streak = 0
  const today = getAppDateKey()
  for (let i = 0; i < 365; i++) {
    const dateKey = addAppDateDays(today, -i)
    if (dates.has(dateKey)) streak++
    else break
  }

  // Category breakdown (30 days)
  const thirtyDaysAgo = getAppRollingRangeUtc(30).start
  const { data: recentRecords } = await supabase
    .from('blood_pressure_records')
    .select('category')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', thirtyDaysAgo)

  const catCounts: Record<string, number> = {}
  ;(recentRecords || []).forEach((r) => {
    catCounts[r.category] = (catCounts[r.category] || 0) + 1
  })
  let dominant = 'normal'
  let maxCount = 0
  for (const [cat, n] of Object.entries(catCounts)) {
    if (n > maxCount) { dominant = cat; maxCount = n }
  }

  const catLabels: Record<string, string> = {
    low: 'Rendah', normal: 'Normal', elevated: 'Meningkat',
    hypertension_stage_1: 'Hipertensi 1', hypertension_stage_2: 'Hipertensi 2',
  }

  // Trend
  let trendLabel = 'stabil'
  let trendScore = 0
  try {
    const trend = await getTrendComparison(30)
    if (trend.systolicTrend === 'down') { trendLabel = 'membaik'; trendScore = 1 }
    else if (trend.systolicTrend === 'up') { trendLabel = 'memburuk'; trendScore = -1 }
  } catch { /* ignore */ }

  // Score
  const catScores: Record<string, number> = {
    low: 1, normal: 2, elevated: 0,
    hypertension_stage_1: -1, hypertension_stage_2: -2,
  }
  const streakScore = streak >= 5 ? 1 : streak <= 1 ? -1 : 0
  const score = trendScore + (catScores[dominant] || 0) + streakScore

  return (
    <RiskGauge
      score={score}
      trendLabel={trendLabel}
      categoryLabel={catLabels[dominant] || dominant}
      streak={streak}
    />
  )
}
