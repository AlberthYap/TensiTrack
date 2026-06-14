import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface ExportRow {
  No: number
  'Tanggal': string
  'Waktu': string
  'Sistolik (mmHg)': number
  'Diastolik (mmHg)': number
  'Tekanan Darah': string
  'Denyut Nadi (bpm)': number | string
  'Kategori': string
  'Catatan': string
}

const CATEGORY_LABELS: Record<string, string> = {
  low: 'Rendah',
  normal: 'Normal',
  elevated: 'Meningkat',
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mi}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Validate token
  const { data: shareToken, error: tokenError } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', params.token)
    .eq('is_active', true)
    .single()

  if (tokenError || !shareToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 401 })
  }

  if (shareToken.max_views && shareToken.view_count >= shareToken.max_views) {
    return NextResponse.json({ error: 'Max views reached' }, { status: 401 })
  }

  let query = supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', shareToken.user_id)
    .is('deleted_at', null)

  if (startDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    query = query.gte('measured_at', start.toISOString())
  }

  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte('measured_at', end.toISOString())
  }

  const { data: records, error } = await query
    .order('measured_at', { ascending: false })
    .limit(10000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows: ExportRow[] = (records || []).map((r, idx) => ({
    No: idx + 1,
    'Tanggal': formatDate(r.measured_at),
    'Waktu': formatTime(r.measured_at),
    'Sistolik (mmHg)': r.systolic,
    'Diastolik (mmHg)': r.diastolic,
    'Tekanan Darah': `${r.systolic}/${r.diastolic}`,
    'Denyut Nadi (bpm)': r.pulse ?? '-',
    'Kategori': CATEGORY_LABELS[r.category] || r.category,
    'Catatan': r.notes ?? '-',
  }))

  return NextResponse.json({ data: rows, total: rows.length })
}
