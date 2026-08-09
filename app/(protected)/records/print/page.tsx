import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatBloodPressure } from '@/lib/blood-pressure'
import { formatExportDate, formatExportTime } from '@/lib/export'
import { PrintButton } from '@/components/features/records/print-button'

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
    <>
      <PrintButton />

      <div className="max-w-[800px] mx-auto p-5 font-sans text-gray-900 dark:text-white">
        <div className="border-b-2 border-blue-500 pb-3 mb-5">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            📋 Riwayat Tekanan Darah
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {userName} — Tensi Harian
          </p>
        </div>

        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>Dicetak: {dateStr} {timeStr}</span>
          <span>Total: {records?.length || 0} pencatatan</span>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <Th>No</Th>
              <Th>Tanggal</Th>
              <Th>Waktu</Th>
              <Th>TD (mmHg)</Th>
              <Th>Nadi</Th>
              <Th>Kategori</Th>
              <Th>Catatan</Th>
            </tr>
          </thead>
          <tbody>
            {(records || []).map((r, i) => (
              <tr key={r.id} className="even:bg-gray-50 dark:even:bg-gray-800/50">
                <Td>{i + 1}</Td>
                <Td>{formatExportDate(r.measured_at)}</Td>
                <Td>{formatExportTime(r.measured_at)}</Td>
                <Td bold>{formatBloodPressure(r.systolic, r.diastolic)}</Td>
                <Td>{r.pulse ? `${r.pulse} bpm` : '-'}</Td>
                <Td>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${catStyle(r.category)}`}>
                    {CAT_LABELS[r.category] || r.category}
                  </span>
                </Td>
                <Td>{r.notes || '-'}</Td>
              </tr>
            ))}
            {(records || []).length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Belum ada pencatatan
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
          Tensi Harian — Aplikasi Pencatat Tekanan Darah
        </div>
      </div>
    </>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  low: 'Rendah', normal: 'Normal', elevated: 'Meningkat',
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

function catStyle(cat: string): string {
  const m: Record<string, string> = {
    normal: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    elevated: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    hypertension_stage_1: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    hypertension_stage_2: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    low: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  }
  return m[cat] || m.normal
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left p-2 bg-gray-100 dark:bg-gray-800 text-xs font-semibold uppercase text-gray-500 border-b-2 border-gray-200 dark:border-gray-700">
      {children}
    </th>
  )
}

function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td className={`p-2 border-b border-gray-100 dark:border-gray-800 ${bold ? 'font-bold' : ''}`}>
      {children}
    </td>
  )
}


