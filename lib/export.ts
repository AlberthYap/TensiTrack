import { CATEGORY_LABELS } from '@/lib/blood-pressure'
import { BloodPressureRecord } from '@/types/blood-pressure.types'

/**
 * Row schema untuk export Excel/CSV.
 */
export interface ExportRow {
  No: number
  Tanggal: string
  Waktu: string
  'Sistolik (mmHg)': number
  'Diastolik (mmHg)': number
  'Tekanan Darah': string
  'Denyut Nadi (bpm)': number | string
  Kategori: string
  Catatan: string
}

/**
 * Format ISO date → dd/MM/yyyy
 */
export function formatExportDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Format ISO date → HH:mm
 */
export function formatExportTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mi}`
}

/**
 * Map record ke ExportRow.
 */
export function mapToExportRow(record: BloodPressureRecord, index: number): ExportRow {
  return {
    No: index + 1,
    Tanggal: formatExportDate(record.measured_at),
    Waktu: formatExportTime(record.measured_at),
    'Sistolik (mmHg)': record.systolic,
    'Diastolik (mmHg)': record.diastolic,
    'Tekanan Darah': `${record.systolic}/${record.diastolic}`,
    'Denyut Nadi (bpm)': record.pulse ?? '-',
    Kategori: CATEGORY_LABELS[record.category] || record.category,
    Catatan: record.notes ?? '-',
  }
}

/**
 * Sanitasi string untuk dijadikan nama file (mencegah injection karakter
 * filesystem-invalid).
 */
export function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '')
}

/**
 * Bangun nama file export berdasarkan filter tanggal.
 */
export function buildExportFilename(startDate?: string, endDate?: string): string {
  const parts = ['riwayat-tekanan-darah']
  if (startDate) parts.push(`dari-${sanitizeFilenamePart(startDate)}`)
  if (endDate) parts.push(`sampai-${sanitizeFilenamePart(endDate)}`)
  return `${parts.join('_')}.xlsx`
}

/**
 * Lebar kolom default untuk worksheet Excel.
 */
export const EXCEL_COLUMN_WIDTHS: Array<{ wch: number }> = [
  { wch: 5 },
  { wch: 14 },
  { wch: 10 },
  { wch: 16 },
  { wch: 16 },
  { wch: 16 },
  { wch: 18 },
  { wch: 22 },
  { wch: 40 },
]

export const EXPORT_SHEET_NAME = 'Riwayat Tekanan Darah'

/**
 * Header (key) untuk worksheet Excel. Dipakai sebagai `header` option di
 * `XLSX.utils.json_to_sheet` agar urutan kolom konsisten.
 */
export const EXPORT_HEADERS: Array<keyof ExportRow> = [
  'No',
  'Tanggal',
  'Waktu',
  'Sistolik (mmHg)',
  'Diastolik (mmHg)',
  'Tekanan Darah',
  'Denyut Nadi (bpm)',
  'Kategori',
  'Catatan',
]
