import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function ShareLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  )
}
