import { calculateCategory } from '@/lib/blood-pressure'
import type { TrendComparison, BloodPressureRecord } from '@/types/blood-pressure.types'
import { getAppDateKey, getAppHour } from '@/lib/timezone'

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

// ---------------------------------------------------------------------------
// Time-of-day pattern insights
// ---------------------------------------------------------------------------

const MORNING_START = 5  // 05:00
const MORNING_END = 11   // before 11:00
const EVENING_START = 17 // 17:00
const EVENING_END = 22   // before 22:00

interface TimeBucket {
  systolicSum: number
  diastolicSum: number
  count: number
}

/**
 * Classify a record into a time-of-day bucket based on measured_at hour.
 * Only recognizes morning (05:00-10:59) and evening (17:00-21:59).
 * Other times are ignored for pattern comparison.
 */
function getTimeBucket(hour: number): 'morning' | 'evening' | null {
  if (hour >= MORNING_START && hour < MORNING_END) return 'morning'
  if (hour >= EVENING_START && hour < EVENING_END) return 'evening'
  return null
}

/**
 * Generate pattern insights from raw weekly records.
 * Focuses on time-of-day consistency and measurement rhythm.
 *
 * This is complementary to `generateTrendInsights` (which compares
 * week-over-week averages). Pattern insights help users understand
 * their measurement habits and diurnal BP variations.
 */
export function generatePatternInsights(
  records: BloodPressureRecord[]
): Insight[] {
  const insights: Insight[] = []

  if (!records || records.length === 0) return insights

  const morning: TimeBucket = { systolicSum: 0, diastolicSum: 0, count: 0 }
  const evening: TimeBucket = { systolicSum: 0, diastolicSum: 0, count: 0 }

  for (const r of records) {
    const hour = getAppHour(r.measured_at)
    const bucket = getTimeBucket(hour)
    if (bucket === 'morning') {
      morning.systolicSum += r.systolic
      morning.diastolicSum += r.diastolic
      morning.count++
    } else if (bucket === 'evening') {
      evening.systolicSum += r.systolic
      evening.diastolicSum += r.diastolic
      evening.count++
    }
  }

  // Insight A: morning-vs-evening comparison (only when both have ≥ 3 readings)
  if (morning.count >= 3 && evening.count >= 3) {
    const mSys = Math.round(morning.systolicSum / morning.count)
    const mDia = Math.round(morning.diastolicSum / morning.count)
    const eSys = Math.round(evening.systolicSum / evening.count)
    const eDia = Math.round(evening.diastolicSum / evening.count)

    const sysDiff = mSys - eSys
    const diaDiff = mDia - eDia

    const higher = sysDiff > 0 ? 'lebih tinggi' : 'lebih rendah'
    const absSysDiff = Math.abs(sysDiff)
    const absDiaDiff = Math.abs(diaDiff)

    if (absSysDiff >= 5 || absDiaDiff >= 5) {
      const tone: InsightTone =
        mSys >= 130 || mDia >= 80 ? 'caution' : 'neutral'

      insights.push({
        id: 'morning-evening',
        tone,
        icon: 'info',
        title: `Pagi ${higher} dari malam`,
        body:
          `Rata-rata pagi ${mSys}/${mDia} mmHg (${morning.count}x) vs malam ${eSys}/${eDia} mmHg (${evening.count}x). ` +
          'Tekanan darah umumnya lebih tinggi di pagi hari — ini normal. Usahakan mengukur di jam yang sama setiap hari.',
      })
    }
  }

  // Insight B: measurement rhythm — only when few unique days suggest skipping
  const uniqueDays = new Set(
    records.map((r) => {
      return getAppDateKey(r.measured_at)
    })
  )
  const totalDays = 7
  if (uniqueDays.size <= 3 && records.length >= 3) {
    insights.push({
      id: 'few-days',
      tone: 'neutral',
      icon: 'info',
      title: `${uniqueDays.size} dari ${totalDays} hari tercatat`,
      body:
        `Minggu ini Anda mencatat di ${uniqueDays.size} hari. Idealnya ukur setiap hari di jam yang sama (pagi sebelum makan/obat dan malam sebelum tidur) untuk pola yang lengkap.`,
    })
  }

  return insights.slice(0, 2)
}
