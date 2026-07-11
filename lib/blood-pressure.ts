import { BloodPressureCategory, CategoryInfo } from '@/types/blood-pressure.types'

/**
 * Category labels dalam Bahasa Indonesia.
 * Single source of truth untuk semua export/UI.
 */
export const CATEGORY_LABELS: Record<BloodPressureCategory, string> = {
  low: 'Rendah',
  normal: 'Normal',
  elevated: 'Meningkat',
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

/**
 * Calculate blood pressure category based on AHA guidelines
 */
export function calculateCategory(
  systolic: number,
  diastolic: number
): BloodPressureCategory {
  // IMPORTANT (AHA "use higher category" rule):
  // When systolic and diastolic fall into different categories,
  // the higher (more severe) category wins. So hypertension stages
  // are evaluated BEFORE hypotension (low).

  // Hypertension Stage 2
  if (systolic >= 140 || diastolic >= 90) {
    return 'hypertension_stage_2'
  }

  // Hypertension Stage 1
  if (systolic >= 130 || diastolic >= 80) {
    return 'hypertension_stage_1'
  }

  // Low (hypotension): evaluated only after HTN checks, so a high
  // DBP still correctly escalates the reading.
  if (systolic < 90 || diastolic < 60) {
    return 'low'
  }

  // Elevated
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return 'elevated'
  }

  // Normal
  return 'normal'
}

/**
 * Get category information (label, color, description)
 */
export function getCategoryInfo(category: BloodPressureCategory): CategoryInfo {
  const categoryMap: Record<BloodPressureCategory, CategoryInfo> = {
    low: {
      label: CATEGORY_LABELS.low,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-300',
      descriptionColor: 'text-blue-600/80 dark:text-blue-400/80',
      description: 'Tekanan darah rendah - konsultasi dokter',
      recommendation: 'Perbanyak istirahat, minum air putih yang cukup, dan hindari perubahan posisi mendadak. Jika sering pusing, segera periksakan diri ke dokter.',
    },
    normal: {
      label: CATEGORY_LABELS.normal,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-700 dark:text-green-300',
      descriptionColor: 'text-green-600/80 dark:text-green-400/80',
      description: 'Tekanan darah normal - pertahankan gaya hidup sehat',
      recommendation: 'Pertahankan pola makan sehat, olahraga teratur (30 menit/hari), kelola stres dengan baik, dan cek tekanan darah secara berkala.',
    },
    elevated: {
      label: CATEGORY_LABELS.elevated,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      descriptionColor: 'text-yellow-600/80 dark:text-yellow-400/80',
      description: 'Tekanan darah meningkat - perlu perubahan gaya hidup',
      recommendation: 'Kurangi konsumsi garam (<5g/hari), olahraga aerobik rutin, jaga berat badan ideal, batasi alkohol, dan kelola stres. Monitor tekanan darah 2-3x seminggu.',
    },
    hypertension_stage_1: {
      label: CATEGORY_LABELS.hypertension_stage_1,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-300',
      descriptionColor: 'text-orange-600/80 dark:text-orange-400/80',
      description: 'Hipertensi tahap 1 - perlu monitoring dan konsultasi',
      recommendation: 'Konsultasi dengan dokter dalam 1-2 minggu. Terapkan diet DASH, olahraga teratur, kurangi garam, dan pantau tekanan darah harian. Dokter mungkin meresepkan obat.',
    },
    hypertension_stage_2: {
      label: CATEGORY_LABELS.hypertension_stage_2,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-300',
      descriptionColor: 'text-red-600/80 dark:text-red-400/80',
      description: 'Hipertensi tahap 2 - segera konsultasi dokter',
      recommendation: '⚠️ SEGERA ke dokter atau IGD jika disertai gejala: sakit kepala hebat, nyeri dada, sesak napas, gangguan penglihatan, atau kelemahan anggota tubuh. Biasanya memerlukan obat kombinasi.',
    },
  }

  return categoryMap[category]
}

/**
 * Format blood pressure reading
 */
export function formatBloodPressure(systolic: number, diastolic: number): string {
  return `${systolic}/${diastolic}`
}

/**
 * Get trend indicator
 */
export function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous
  const threshold = 5 // 5 mmHg threshold

  if (Math.abs(diff) < threshold) return 'stable'
  return diff > 0 ? 'up' : 'down'
}
