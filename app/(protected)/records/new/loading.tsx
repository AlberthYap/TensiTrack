import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonForm } from '@/components/ui/skeleton'

export default function NewRecordLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <SkeletonForm fields={4} />
      </div>
    </div>
  )
}
