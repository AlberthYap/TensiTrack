import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyDateRange } from '@/lib/supabase/queries'
import { mapToExportRow } from '@/lib/export'
import { validateShareToken } from '@/app/actions/share'
import { BloodPressureRecord } from '@/types/blood-pressure.types'

export const dynamic = 'force-dynamic'

/**
 * Export endpoint untuk share token publik.
 *
 * FIX: Sebelumnya endpoint ini memvalidasi token manual (read-only) tanpa
 * increment `view_count`. Akibatnya, download Excel tidak dihitung ke view
 * count, sehingga bisa melebihi `max_views`. Sekarang kita pakai
 * `validateShareToken` server action yang sudah atomic — export hit
 * counted sebagai 1 view.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Validate token (atomic via RPC, increments view_count)
  const { data: shareToken, error: tokenError } = await validateShareToken(params.token)

  if (tokenError || !shareToken) {
    return NextResponse.json({ error: tokenError || 'Invalid token' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  let query = supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', shareToken.user_id)
    .is('deleted_at', null)

  query = applyDateRange(query, { startDate, endDate })

  const { data: records, error } = await query
    .order('measured_at', { ascending: false })
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (records || []).map((r, idx) =>
    mapToExportRow(r as BloodPressureRecord, idx)
  )

  return NextResponse.json({ data: rows, total: rows.length })
}
