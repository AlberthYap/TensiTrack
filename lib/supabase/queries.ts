import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Opsi filter rentang tanggal lokal (mengikuti timezone server).
 */
export interface DateRangeOptions {
  startDate?: string
  endDate?: string
}

/**
 * Terapkan filter `measured_at` pada Supabase PostgREST query builder.
 *
 * - `startDate` di-anchor ke awal hari (00:00:00.000) lokal
 * - `endDate` di-anchor ke akhir hari (23:59:59.999) lokal
 *
 * @returns builder yang sama (untuk chainable `.eq`, `.is`, dll)
 */
export function applyDateRange<T extends Record<string, unknown>>(
  query: any,
  options: DateRangeOptions
): any {
  let q = query

  if (options.startDate) {
    const start = new Date(options.startDate)
    start.setHours(0, 0, 0, 0)
    q = q.gte('measured_at', start.toISOString())
  }

  if (options.endDate) {
    const end = new Date(options.endDate)
    end.setHours(23, 59, 59, 999)
    q = q.lte('measured_at', end.toISOString())
  }

  return q
}
