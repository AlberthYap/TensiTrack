import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatBloodPressure } from '@/lib/blood-pressure'
import { formatExportDate, formatExportTime } from '@/lib/export'
import type { BloodPressureRecord } from '@/types/blood-pressure.types'

export const dynamic = 'force-dynamic'

export default async function PrintRecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: records } = await supabase
    .from('blood_pressure_records')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1000)

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const now = new Date()
  const dateStr = formatExportDate(now.toISOString())
  const timeStr = formatExportTime(now.toISOString())

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <title>Riwayat Tekanan Darah — {userName}</title>
        <style>{`
          @media print {
            @page { margin: 1.5cm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 20px; color: #3b82f6; }
          .header p { font-size: 13px; color: #64748b; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
          tr:nth-child(even) td { background: #fafbfc; }
          .bp { font-weight: 700; font-size: 14px; }
          .cat { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
          .cat-normal { background: #d1fae5; color: #065f46; }
          .cat-elevated { background: #fef3c7; color: #92400e; }
          .cat-stage1 { background: #ffedd5; color: #9a3412; }
          .cat-stage2 { background: #fee2e2; color: #991b1b; }
          .cat-low { background: #dbeafe; color: #1e40af; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; margin-bottom: 16px; }
          .btn:hover { background: #2563eb; }
        `}</style>
      </head>
      <body>
        <button className="btn no-print" onClick={() => window.print()}>
          🖨️ Cetak Halaman Ini
        </button>

        <div className="header">
          <h1>📋 Riwayat Tekanan Darah</h1>
          <p>{userName} — Tensi Harian</p>
        </div>

        <div className="meta">
          <span>Dicetak: {dateStr} {timeStr}</span>
          <span>Total: {records?.length || 0} pencatatan</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Waktu</th>
              <th>TD (mmHg)</th>
              <th>Nadi</th>
              <th>Kategori</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {(records || []).map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{formatExportDate(r.measured_at)}</td>
                <td>{formatExportTime(r.measured_at)}</td>
                <td className="bp">{formatBloodPressure(r.systolic, r.diastolic)}</td>
                <td>{r.pulse ? `${r.pulse} bpm` : '-'}</td>
                <td>
                  <span className={`cat cat-${getCategoryClass(r.category)}`}>
                    {CATEGORY_LABEL[r.category as keyof typeof CATEGORY_LABEL] || r.category}
                  </span>
                </td>
                <td>{r.notes || '-'}</td>
              </tr>
            ))}
            {(records || []).length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  Belum ada pencatatan
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="footer">
          Tensi Harian — Aplikasi Pencatat Tekanan Darah
        </div>

        <script dangerouslySetInnerHTML={{ __html: '/* auto-print on load */' }} />
      </body>
    </html>
  )
}

const CATEGORY_LABEL: Record<string, string> = {
  low: 'Rendah',
  normal: 'Normal',
  elevated: 'Meningkat',
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

function getCategoryClass(cat: string): string {
  if (cat === 'normal') return 'normal'
  if (cat === 'elevated') return 'elevated'
  if (cat === 'hypertension_stage_1') return 'stage1'
  if (cat === 'hypertension_stage_2') return 'stage2'
  if (cat === 'low') return 'low'
  return 'normal'
}
