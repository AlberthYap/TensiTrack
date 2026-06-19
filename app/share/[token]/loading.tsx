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

      {/* Stats skeleton (preserved) */}
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

      {/* Hero analytics card skeleton */}
      <div className="rounded-3xl border border-white/30 dark:border-white/10 bg-gradient-to-br from-violet-600/30 via-blue-600/30 to-indigo-700/30 dark:from-violet-700/30 dark:via-blue-700/30 dark:to-indigo-800/30 backdrop-blur-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-6 w-56" />
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
        <div className="space-y-3 py-2 text-center">
          <Skeleton className="h-3 w-32 mx-auto" />
          <Skeleton className="h-16 sm:h-20 w-56 mx-auto rounded-xl" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/10 p-3 space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 pt-2 border-t border-white/15">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* 3 chart card skeletons */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-white/40 dark:border-white/5">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <div className="p-5 sm:p-6 space-y-3">
            {i === 1 ? (
              // category distribution skeleton: stacked bars
              <div className="space-y-3">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : i === 2 ? (
              // trend indicator skeleton: 2 side-by-side cards
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1].map((j) => (
                  <div
                    key={j}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2"
                  >
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : (
              // chart skeleton
              <Skeleton className="h-[320px] w-full rounded-lg" />
            )}
          </div>
        </div>
      ))}

      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  )
}
