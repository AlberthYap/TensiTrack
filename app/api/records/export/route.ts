import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyDateRange } from '@/lib/supabase/queries'
import { mapToExportRow } from '@/lib/export'
import { BloodPressureRecord } from '@/types/blood-pressure.types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  let query = supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
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
