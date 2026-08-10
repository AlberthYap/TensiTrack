import { createClient } from '@/lib/supabase/server'
import { TagCorrelationCard, type TagCorrelation } from './tag-correlation-card'
import { LIFESTYLE_TAGS, getTag } from '@/lib/lifestyle-tags'

export async function TagCorrelationSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: records } = await supabase
    .from('blood_pressure_records')
    .select('systolic, diastolic, tags')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('measured_at', thirtyDaysAgo.toISOString())

  if (!records || records.length < 5) return null

  const correlations: TagCorrelation[] = LIFESTYLE_TAGS.map((tag) => {
    const withTag = records.filter((r) => r.tags?.includes(tag.key))
    const withoutTag = records.filter((r) => !r.tags?.includes(tag.key))

    if (withTag.length < 2 || withoutTag.length === 0) return null!

    const avg = (arr: typeof records, key: 'systolic' | 'diastolic') =>
      Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length)

    return {
      tag: getTag(tag.key) || tag,
      countWith: withTag.length,
      countWithout: withoutTag.length,
      avgSystolicWith: avg(withTag, 'systolic'),
      avgDiastolicWith: avg(withTag, 'diastolic'),
      avgSystolicWithout: avg(withoutTag, 'systolic'),
      avgDiastolicWithout: avg(withoutTag, 'diastolic'),
      sysDiff: avg(withTag, 'systolic') - avg(withoutTag, 'systolic'),
      diaDiff: avg(withTag, 'diastolic') - avg(withoutTag, 'diastolic'),
    }
  }).filter(Boolean)

  return <TagCorrelationCard correlations={correlations} />
}
