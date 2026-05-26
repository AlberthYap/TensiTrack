import { BloodPressureCategory, CategoryInfo } from '@/types/blood-pressure.types'

/**
 * Calculate blood pressure category based on AHA guidelines
 */
export function calculateCategory(
  systolic: number,
  diastolic: number
): BloodPressureCategory {
  // Low
  if (systolic < 90 || diastolic < 60) {
    return 'low'
  }
  
  // Hypertension Stage 2
  if (systolic >= 140 || diastolic >= 90) {
    return 'hypertension_stage_2'
  }
  
  // Hypertension Stage 1
  if (systolic >= 130 || diastolic >= 80) {
    return 'hypertension_stage_1'
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
      label: 'Rendah',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'Tekanan darah rendah - konsultasi dokter',
    },
    normal: {
      label: 'Normal',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      description: 'Tekanan darah normal - pertahankan gaya hidup sehat',
    },
    elevated: {
      label: 'Meningkat',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      description: 'Tekanan darah meningkat - perlu perubahan gaya hidup',
    },
    hypertension_stage_1: {
      label: 'Hipertensi Tahap 1',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      description: 'Hipertensi tahap 1 - perlu monitoring dan konsultasi',
    },
    hypertension_stage_2: {
      label: 'Hipertensi Tahap 2',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      description: 'Hipertensi tahap 2 - segera konsultasi dokter',
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
