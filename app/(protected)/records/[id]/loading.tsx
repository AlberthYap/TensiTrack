import { Skeleton } from '@/components/ui/skeleton'

export default function RecordDetailLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Hero card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 space-y-4">
        <div className="flex items-center justify-center">
          <Skeleton className="h-20 w-48" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
