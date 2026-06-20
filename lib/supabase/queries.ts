import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Opsi filter rentang tanggal lokal (mengikuti timezone server).
 */
export interface DateRangeOptions {
  startDate?: string
  endDate?: string
}

/**
 * Tipe minimal PostgREST filter builder yang dibutuhkan oleh helper ini.
 * Supabase typings lengkap (PostgrestFilterBuilder) sangat generik dan
 * membutuhkan chain dari `.from()` yang spesifik; tipe ringkas ini
 * mempertahankan type-safety pada method `gte` / `lte` / `eq` / `is`
 * yang dipakai, sambil tidak memaksakan generic pada setiap pemanggil.
 */
type QueryFilterBuilder = {
  gte(column: string, value: string | number): QueryFilterBuilder
  lte(column: string, value: string | number): QueryFilterBuilder
  eq(column: string, value: unknown): QueryFilterBuilder
  is(column: string, value: unknown): QueryFilterBuilder
}

/**
 * Terapkan filter `measured_at` pada Supabase PostgREST query builder.
 *
 * - `startDate` di-anchor ke awal hari (00:00:00.000) lokal
 * - `endDate` di-anchor ke akhir hari (23:59:59.999) lokal
 *
 * @returns builder yang sama (untuk chainable `.eq`, `.is`, dll)
 */
export function applyDateRange<Q extends QueryFilterBuilder>(
  query: Q,
  options: DateRangeOptions
): Q {
  let q: Q = query

  if (options.startDate) {
    const start = new Date(options.startDate)
    start.setHours(0, 0, 0, 0)
    q = q.gte('measured_at', start.toISOString()) as Q
  }

  if (options.endDate) {
    const end = new Date(options.endDate)
    end.setHours(23, 59, 59, 999)
    q = q.lte('measured_at', end.toISOString()) as Q
  }

  return q
}

/**
 * Tipe Supabase client yang sudah terikat ke Database schema.
 * Dipakai untuk typed queries di luar server actions.
 */
export type TypedSupabaseClient = SupabaseClient<Database>
