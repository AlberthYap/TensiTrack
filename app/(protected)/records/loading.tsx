import { SkeletonHeader, SkeletonTable } from '@/components/ui/skeleton'

export default function RecordsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />

      {/* Filter bar skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <SkeletonTable rows={8} columns={6} />
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-9 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
