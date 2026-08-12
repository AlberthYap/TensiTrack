import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getAppDateRangeUtc } from '@/lib/timezone'

/** Opsi filter rentang tanggal kalender Asia/Jakarta. */
export interface DateRangeOptions {
  startDate?: string
  endDate?: string
}

type QueryFilterBuilder = {
  gte(column: string, value: string | number): QueryFilterBuilder
  lte(column: string, value: string | number): QueryFilterBuilder
  eq(column: string, value: unknown): QueryFilterBuilder
  is(column: string, value: unknown): QueryFilterBuilder
}

/**
 * Apply measured_at boundaries for local calendar dates in Asia/Jakarta.
 * The database still stores/query timestamps as UTC instants.
 */
export function applyDateRange<Q extends QueryFilterBuilder>(
  query: Q,
  options: DateRangeOptions
): Q {
  let q: Q = query
  const range = getAppDateRangeUtc(options.startDate, options.endDate)

  if (range.start) q = q.gte('measured_at', range.start) as Q
  if (range.end) q = q.lte('measured_at', range.end) as Q

  return q
}

export type TypedSupabaseClient = SupabaseClient<Database>
