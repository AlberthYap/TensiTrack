import {
  Skeleton,
  SkeletonHeader,
  SkeletonStatCard,
  SkeletonChart,
  SkeletonTable,
} from '@/components/ui/skeleton'

/**
 * Generic skeleton for all protected pages — dashboard, records, analytics,
 * settings, etc. Shown instantly on route change while the server renders.
 *
 * The layout shell (Header + Sidebar) renders normally; only the page
 * content is replaced with this skeleton.
 */
export default function ProtectedLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title + subtitle */}
      <SkeletonHeader />

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Large content area — chart, table, or form */}
      <SkeletonChart height={280} />

      {/* Secondary section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-32" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  )
}
