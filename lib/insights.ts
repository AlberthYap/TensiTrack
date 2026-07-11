import { calculateCategory } from '@/lib/blood-pressure'
import type { TrendComparison } from '@/types/blood-pressure.types'

/**
 * Tone category for an insight — drives icon + color in the UI.
 * - positive   : trend is good (down or stable at normal range)
 * - neutral    : informational / encouraging consistency
 * - caution    : lifestyle nudge (no clinical concern yet)
 * - attention  : sustained elevated category OR worsening trend at stage 1/2
 */
export type InsightTone = 'positive' | 'neutral' | 'caution' | 'attention'

export type InsightIcon =
  | 'trending-up'
  | 'trending-down'
  | 'minus'
  | 'check-circle'
  | 'info'
  | 'alert-triangle'

export interface Insight {
  id: string
  tone: InsightTone
  icon: InsightIcon
  title: string
  body: string
}

/** mmHg threshold for "meaningful" change. Aligned with getTrend() in lib/blood-pressure.ts. */
const SIGNIFICANT_CHANGE = 5

/** Need meaningful prior baseline to call out a frequency drop (avoids noise). */
const FREQ_DROP_MIN_BASELINE = 5

/** Show frequency drop when current is below this fraction of previous. */
const FREQ_DROP_RATIO = 0.7

const HIGH_CATEGORY_LABEL: Record<string, string> = {
  hypertension_stage_1: 'Hipertensi Tahap 1',
  hypertension_stage_2: 'Hipertensi Tahap 2',
}

function buildChangeTitle(sChange: number, dChange: number): string {
  const sysChanged = Math.abs(sChange) >= SIGNIFICANT_CHANGE
  const diaChanged = Math.abs(dChange) >= SIGNIFICANT_CHANGE

  const sysPart = sysChanged
    ? `Sistolik ${sChange > 0 ? 'naik' : 'turun'} ${Math.abs(sChange)} mmHg`
    : null
  const diaPart = diaChanged
    ? `Diastolik ${dChange > 0 ? 'naik' : 'turun'} ${Math.abs(dChange)} mmHg`
    : null

  if (sysPart && diaPart) return `${sysPart}, ${diaPart.toLowerCase()}`
  if (sysPart) return sysPart
  if (diaPart) return diaPart
  return 'Tren stabil'
}

function getAdvice(
  sysDir: 'up' | 'down' | 'stable',
  diaDir: 'up' | 'down' | 'stable',
  isHighCategory: boolean,
  highLabel: string | null
): string {
  const isWorse = sysDir === 'up' || diaDir === 'up'
  const isBetter = sysDir === 'down' || diaDir === 'down'

  if (isWorse && isHighCategory) {
    return `Rata-rata Anda minggu ini masih di kategori ${highLabel}. Pertahankan waktu minum obat dan jadwal kontrol ke dokter.`
  }
  if (isWorse) {
    return 'Perhatikan pola tidur, kafein, konsumsi garam (<5g/hari), dan tingkat stres Anda.'
  }
  if (isBetter && isHighCategory) {
    return 'Tren tampak membaik, namun rata-rata masih di atas ambang normal. Tetap jaga rutinitas dan kontrol ke dokter.'
  }
  if (isBetter) {
    return 'Pertahankan gaya hidup yang sudah membantu ini.'
  }
  return 'Pertahankan konsistensi Anda.'
}

function deriveDirs(sChange: number, dChange: number): {
  sysDir: 'up' | 'down' | 'stable'
  diaDir: 'up' | 'down' | 'stable'
} {
  const sysDir =
    sChange >= SIGNIFICANT_CHANGE
      ? 'up'
      : sChange <= -SIGNIFICANT_CHANGE
        ? 'down'
        : 'stable'
  const diaDir =
    dChange >= SIGNIFICANT_CHANGE
      ? 'up'
      : dChange <= -SIGNIFICANT_CHANGE
        ? 'down'
        : 'stable'
  return { sysDir, diaDir }
}

/**
 * Generate 1–2 plain-language insights comparing the last `periodDays` window
 * against the previous `periodDays` window. Caps output to keep cognitive load
 * low for the elder user base.
 */
export function generateTrendInsights(c: TrendComparison): Insight[] {
  const insights: Insight[] = []
  const { current, previous, systolicChange, diastolicChange } = c

  // Case A: no readings in current period
  if (current.readingCount === 0) {
    insights.push({
      id: 'no-data',
      tone: 'neutral',
      icon: 'info',
      title: 'Belum ada catatan minggu ini',
      body: 'Minggu ini belum ada pembacaan tekanan darah. Coba ukur pagi sebelum makan/obat dan malam sebelum tidur untuk pola yang lengkap.',
    })
    return insights
  }

  // Case B: first period being tracked (previous was empty)
  if (previous.readingCount === 0) {
    insights.push({
      id: 'first-period',
      tone: 'positive',
      icon: 'check-circle',
      title: 'Mulai konsisten!',
      body: `Anda mencatat ${current.readingCount} pembacaan minggu ini. Pertahankan ritme ini — minimal 3 kali seminggu agar tren terlihat jelas.`,
    })
    return insights
  }

  const currentCategory = calculateCategory(
    current.averageSystolic,
    current.averageDiastolic
  )
  const isHighCategory =
    currentCategory === 'hypertension_stage_1' ||
    currentCategory === 'hypertension_stage_2'
  const highLabel = HIGH_CATEGORY_LABEL[currentCategory] ?? null

  const sysChanged = Math.abs(systolicChange) >= SIGNIFICANT_CHANGE
  const diaChanged = Math.abs(diastolicChange) >= SIGNIFICANT_CHANGE

  // Case C: stable — neither changed meaningfully
  if (!sysChanged && !diaChanged) {
    insights.push({
      id: 'stable',
      tone: isHighCategory ? 'attention' : 'positive',
      icon: isHighCategory ? 'alert-triangle' : 'check-circle',
      title: isHighCategory
        ? 'Tekanan darah stabil, namun masih tinggi'
        : 'Tren tekanan darah stabil',
      body: isHighCategory
        ? `Rata-rata minggu ini ${current.averageSystolic}/${current.averageDiastolic} mmHg — tetap di kategori ${highLabel}. Lanjutkan pengobatan sesuai anjuran dokter dan jaga jadwal kontrol rutin ke dokter.`
        : `Rata-rata minggu ini ${current.averageSystolic}/${current.averageDiastolic} mmHg — sama dengan minggu lalu. Pertahankan gaya hidup sehat Anda.`,
    })
  } else {
    // Case D: at least one of systolic/diastolic changed — combine into ONE insight
    const { sysDir, diaDir } = deriveDirs(systolicChange, diastolicChange)
    const isWorse = sysDir === 'up' || diaDir === 'up'

    insights.push({
      id: 'trend-change',
      tone: isWorse ? (isHighCategory ? 'attention' : 'caution') : 'positive',
      icon: isWorse ? 'trending-up' : 'trending-down',
      title: buildChangeTitle(systolicChange, diastolicChange),
      body: `Rata-rata minggu ini ${current.averageSystolic}/${current.averageDiastolic} mmHg — minggu lalu ${previous.averageSystolic}/${previous.averageDiastolic} mmHg. ${getAdvice(sysDir, diaDir, isHighCategory, highLabel)}`,
    })
  }

  // Case E: frequency drop (only with meaningful prior baseline)
  if (previous.readingCount >= FREQ_DROP_MIN_BASELINE) {
    const ratio = current.readingCount / previous.readingCount
    if (ratio < FREQ_DROP_RATIO) {
      insights.push({
        id: 'freq-drop',
        tone: 'neutral',
        icon: 'info',
        title: 'Pencatatan berkurang',
        body: `Minggu ini ${current.readingCount} pembacaan (minggu lalu ${previous.readingCount}). Konsistensi membantu tren terlihat jelas — idealnya 7+ per minggu.`,
      })
    }
  }

  // Cap at 2 — preserve cognitive load budget for elder users.
  return insights.slice(0, 2)
}
