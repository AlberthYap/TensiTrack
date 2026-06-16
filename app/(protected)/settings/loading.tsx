import { SkeletonHeader, SkeletonFormField } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <SkeletonHeader />

      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <SkeletonFormField />
        <SkeletonFormField />
        <div className="h-10 w-32 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Security card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <SkeletonFormField />
        <SkeletonFormField />
        <SkeletonFormField />
        <div className="h-10 w-40 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}
