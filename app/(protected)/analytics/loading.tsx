import { SkeletonHeader, SkeletonStatCard, SkeletonChart } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Charts */}
      <SkeletonChart height={300} />
      <SkeletonChart height={300} />
    </div>
  )
}
