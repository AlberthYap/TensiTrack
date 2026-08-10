/**
 * Lifestyle tags for blood pressure records.
 * Stored as short keys in the DB, displayed with icons and labels.
 */
export interface LifestyleTag {
  key: string
  label: string
  emoji: string
}

export const LIFESTYLE_TAGS: LifestyleTag[] = [
  { key: 'stress', label: 'Stres', emoji: '😰' },
  { key: 'salty_food', label: 'Makan asin', emoji: '🍜' },
  { key: 'lack_sleep', label: 'Kurang tidur', emoji: '😴' },
  { key: 'exercise', label: 'Olahraga', emoji: '🏃' },
  { key: 'missed_meds', label: 'Lupa obat', emoji: '💊' },
  { key: 'alcohol', label: 'Alkohol', emoji: '🍺' },
  { key: 'caffeine', label: 'Kafein', emoji: '☕' },
  { key: 'unwell', label: 'Tidak enak badan', emoji: '🤒' },
]

export function getTag(key: string): LifestyleTag | undefined {
  return LIFESTYLE_TAGS.find((t) => t.key === key)
}
