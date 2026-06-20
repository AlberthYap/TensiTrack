import { BloodPressureInput } from '@/types/blood-pressure.types'
import { calculateCategory } from '@/lib/blood-pressure'

/**
 * Batas maksimum baris data yang boleh diimpor sekaligus.
 *
 * Dibatasi untuk mencegah DoS (server action dipanggil ribuan kali) dan
 * UX buruk (loading terlalu lama). User tetap bisa split file >MAX_ROWS
 * menjadi beberapa batch.
 */
export const MAX_IMPORT_ROWS = 1000

/**
 * Hasil parsing CSV: baris valid + daftar error per-baris.
 */
export interface CsvImportResult {
  validRows: BloodPressureInput[]
  errors: Array<{
    row: number
    message: string
    raw: string
  }>
  totalRows: number
  /** true bila file melebihi MAX_IMPORT_ROWS dan harus di-split. */
  truncated: boolean
}

/**
 * Parse CSV string menjadi array of rows (handle quoted fields & commas).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    const next = normalized[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      current.push(field)
      field = ''
    } else if (ch === '\n') {
      current.push(field)
      rows.push(current)
      current = []
      field = ''
    } else {
      field += ch
    }
  }

  // Flush last field/row
  if (field.length > 0 || current.length > 0) {
    current.push(field)
    rows.push(current)
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0))
}

export interface CsvColumnMap {
  systolic: number
  diastolic: number
  pulse?: number
  measured_at: number
  notes?: number
}

/**
 * Detect kolom CSV dari header. Mencocokkan nama kolom dengan berbagai varian.
 */
export function detectColumns(header: string[]): CsvColumnMap | null {
  const find = (candidates: string[]): number => {
    const lower = header.map((h) => h.toLowerCase().trim())
    for (const c of candidates) {
      const idx = lower.indexOf(c)
      if (idx >= 0) return idx
    }
    return -1
  }

  const systolic = find(['sistolik', 'systolic', 'sys', 's'])
  const diastolic = find(['diastolik', 'diastolic', 'dia', 'd'])
  const measured_at = find([
    'tanggal',
    'date',
    'measured_at',
    'waktu',
    'datetime',
    'timestamp',
  ])
  const pulse = find(['nadi', 'pulse', 'denyut', 'p', 'bpm'])
  const notes = find(['catatan', 'notes', 'keterangan', 'note'])

  if (systolic < 0 || diastolic < 0 || measured_at < 0) {
    return null
  }

  return {
    systolic,
    diastolic,
    measured_at,
    ...(pulse >= 0 && { pulse }),
    ...(notes >= 0 && { notes }),
  }
}

/**
 * Parse satu baris CSV menjadi BloodPressureInput.
 * Mengembalikan error string jika invalid.
 */
function parseRow(
  row: string[],
  map: CsvColumnMap,
  rowIndex: number
): { value: BloodPressureInput | null; error: string | null } {
  const systolicRaw = row[map.systolic]?.trim() ?? ''
  const diastolicRaw = row[map.diastolic]?.trim() ?? ''
  const dateRaw = row[map.measured_at]?.trim() ?? ''

  if (!systolicRaw || !diastolicRaw || !dateRaw) {
    return {
      value: null,
      error: `Baris ${rowIndex + 2}: kolom wajib kosong (sistolik, diastolik, atau tanggal)`,
    }
  }

  const systolic = Number(systolicRaw)
  const diastolic = Number(diastolicRaw)

  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return {
      value: null,
      error: `Baris ${rowIndex + 2}: sistolik/diastolik bukan angka`,
    }
  }

  if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
    return {
      value: null,
      error: `Baris ${rowIndex + 2}: nilai sistolik/diastolik di luar rentang wajar`,
    }
  }

  // Parse date - support multiple formats
  const measured_at = parseDate(dateRaw)
  if (!measured_at) {
    return {
      value: null,
      error: `Baris ${rowIndex + 2}: format tanggal tidak dikenali: "${dateRaw}"`,
    }
  }

  let pulse: number | null = null
  if (map.pulse !== undefined && row[map.pulse]) {
    const p = Number(row[map.pulse].trim())
    if (Number.isNaN(p)) {
      return {
        value: null,
        error: `Baris ${rowIndex + 2}: denyut nadi bukan angka`,
      }
    }
    pulse = p
  }

  const notes = map.notes !== undefined && row[map.notes] ? row[map.notes].trim() : null

  return {
    value: { systolic, diastolic, measured_at, pulse, notes },
    error: null,
  }
}

function parseDate(input: string): string | null {
  // ISO format (2024-01-15 or 2024-01-15T10:30:00)
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(input)) {
    const d = new Date(input)
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (dmy) {
    const [, d, m, y, hh, mm] = dmy
    const date = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      hh ? Number(hh) : 12,
      mm ? Number(mm) : 0
    )
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // DD/MM/YYYY HH:mm:ss
  const dmy2 = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/)
  if (dmy2) {
    const [, d, m, y, hh, mm, ss] = dmy2
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // YYYY/MM/DD
  const ymd = input.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // Fallback ke Date constructor
  const d = new Date(input)
  if (!isNaN(d.getTime())) return d.toISOString()

  return null
}

/**
 * Parse seluruh CSV: deteksi header, mapping kolom, validasi tiap baris.
 */
export function parseCsvImport(text: string): CsvImportResult {
  const rows = parseCsv(text)
  if (rows.length < 2) {
    return {
      validRows: [],
      errors: [{ row: 0, message: 'File CSV kosong atau tidak memiliki data', raw: '' }],
      totalRows: 0,
      truncated: false,
    }
  }

  const header = rows[0]
  const map = detectColumns(header)

  if (!map) {
    return {
      validRows: [],
      errors: [
        {
          row: 0,
          message:
            'Header CSV harus memuat kolom: sistolik/systolic, diastolik/diastolic, dan tanggal/date',
          raw: header.join(','),
        },
      ],
      totalRows: rows.length - 1,
      truncated: false,
    }
  }

  const validRows: BloodPressureInput[] = []
  const errors: CsvImportResult['errors'] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const { value, error } = parseRow(row, map, i - 1)
    if (error) {
      errors.push({ row: i, message: error, raw: row.join(',') })
    } else if (value) {
      validRows.push(value)
    }
  }

  // Batasi jumlah baris yang diproses untuk mencegah DoS & loading
  // yang terlalu lama pada file besar.
  const dataRowCount = rows.length - 1
  const truncated = dataRowCount > MAX_IMPORT_ROWS
  const finalValidRows = truncated
    ? validRows.slice(0, MAX_IMPORT_ROWS)
    : validRows

  if (truncated) {
    errors.push({
      row: 0,
      message: `File memiliki ${dataRowCount} baris, melebihi batas maksimum ${MAX_IMPORT_ROWS} baris. Hanya ${MAX_IMPORT_ROWS} baris pertama yang akan diimpor. Silakan split file menjadi beberapa bagian.`,
      raw: '',
    })
  }

  return {
    validRows: finalValidRows,
    errors,
    totalRows: dataRowCount,
    truncated,
  }
}

/**
 * Hitung kategori untuk logging/preview (uses canonical lib function).
 */
export function previewCategory(input: BloodPressureInput) {
  return calculateCategory(input.systolic, input.diastolic)
}
