import { getWeeklyRecords } from '@/lib/dashboard-queries'
import { getTrendComparison } from '@/app/actions/analytics'
import { generateTrendInsights, generatePatternInsights, type Insight } from '@/lib/insights'
import { DashboardInsightWidget } from './insight-widget'

interface InsightsSectionProps {
  userId: string
}

export async function InsightsSection({ userId }: InsightsSectionProps) {
  // Weekly records — cached: shared with WeeklySection, 1 query total.
  const weeklyRecords = await getWeeklyRecords(userId)

  let insights: Insight[] = []
  try {
    const trendComparison = await getTrendComparison(7)
    const trendInsights = generateTrendInsights(trendComparison)
    const patternInsights = generatePatternInsights(
      (weeklyRecords ?? []) as Parameters<typeof generatePatternInsights>[0]
    )
    insights = [...trendInsights, ...patternInsights]
  } catch {
    insights = []
  }

  if (insights.length === 0) return null

  return <DashboardInsightWidget insights={insights} />
}
