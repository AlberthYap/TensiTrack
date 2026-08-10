import { createClient } from '@/lib/supabase/server'
import { getTrendComparison } from '@/app/actions/analytics'
import { RiskGauge } from './risk-gauge'

export async function RiskGaugeSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Streak data
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const { data: streakRecords } = await supabase
    .from('blood_pressure_records')
    .select('measured_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', oneYearAgo.toISOString())
    .order('measured_at', { ascending: false })

  if (!streakRecords || streakRecords.length < 3) return null

  // Compute streak using WIB-adjusted dates (server runs UTC, users are UTC+7).
  const toWibDate = (iso: string) => {
    const d = new Date(iso)
    d.setHours(d.getUTCHours() + 7)
    return d.toISOString().slice(0, 10)
  }
  const dates = new Set(streakRecords.map((r) => toWibDate(r.measured_at)))
  let streak = 0
  const today = new Date()
  today.setHours(today.getUTCHours() + 7) // WIB today
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dates.has(d.toISOString().slice(0, 10))) streak++
    else break
  }

  // Category breakdown (30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: recentRecords } = await supabase
    .from('blood_pressure_records')
    .select('category')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', thirtyDaysAgo.toISOString())

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
