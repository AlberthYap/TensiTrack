export type BloodPressureCategory =
  | 'low'
  | 'normal'
  | 'elevated'
  | 'hypertension_stage_1'
  | 'hypertension_stage_2'

export interface BloodPressureRecord {
  id: string
  user_id: string
  systolic: number
  diastolic: number
  pulse: number | null
  category: BloodPressureCategory
  notes: string | null
  measured_at: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface BloodPressureInput {
  systolic: number
  diastolic: number
  pulse?: number | null
  notes?: string | null
  measured_at: string
}

export interface CategoryInfo {
  label: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  descriptionColor: string
  description: string
  recommendation?: string
}

export interface PaginatedRecords {
  data: BloodPressureRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetRecordsOptions {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}

/**
 * Agregat statistik untuk satu bulan kalender.
 * Dipakai oleh halaman Analytics (auth) dan Share (read-only via token).
 */
export interface MonthlyStats {
  year: number
  /** 1-12 */
  month: number
  /** e.g. "Juni 2026" */
  monthLabel: string
  totalReadings: number
  averageSystolic: number
  averageDiastolic: number
  averagePulse: number | null
  highestSystolic: number
  highestDiastolic: number
  lowestSystolic: number
  lowestDiastolic: number
  categoryBreakdown: Record<BloodPressureCategory, number>
  daysTracked: number
}

/**
 * Satu titik data untuk grafik harian.
 * Jika tidak ada pencatatan di tanggal tersebut, semua nilai numerik null.
 */
export interface DailyPoint {
  /** ISO yyyy-MM-dd */
  date: string
  /** e.g. "16 Jun" */
  label: string
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  count: number
}

/**
 * Distribusi kategori dalam satu periode waktu.
 */
export interface CategoryDistribution {
  total: number
  items: Array<{
    category: BloodPressureCategory
    count: number
    percentage: number
  }>
}

/**
 * Perbandingan tren antara dua periode (mis. 30 hari terakhir vs 30 hari sebelumnya).
 */
export interface TrendComparison {
  current: {
    startDate: string
    endDate: string
    averageSystolic: number
    averageDiastolic: number
    readingCount: number
  }
  previous: {
    startDate: string
    endDate: string
    averageSystolic: number
    averageDiastolic: number
    readingCount: number
  }
  /** delta current - previous */
  systolicChange: number
  diastolicChange: number
  systolicTrend: 'up' | 'down' | 'stable'
  diastolicTrend: 'up' | 'down' | 'stable'
}
