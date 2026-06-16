import { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

/**
 * Generic skeleton placeholder with subtle shimmer.
 * Use to indicate loading content areas.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  )
}

/** Skeleton untuk header halaman (judul + subjudul) */
export function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

/** Skeleton untuk satu baris tabel */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 flex-1', i === 0 && 'max-w-[80px]')}
        />
      ))}
    </div>
  )
}

/** Skeleton untuk table lengkap */
export function SkeletonTable({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  )
}

/** Skeleton untuk stat card */
export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Skeleton untuk chart card */
export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="w-full rounded-lg" style={{ height: `${height}px` }} />
    </div>
  )
}

/** Skeleton untuk form fields */
export function SkeletonFormField() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/** Skeleton untuk full form */
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: fields }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
