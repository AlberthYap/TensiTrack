/**
 * Robust parser for spoken blood-pressure values via the Web Speech API.
 *
 * Chrome/Edge (id-ID) frequently transcribes "120 80" in unexpected ways:
 *   - "120 80"        → digits
 *   - "120 per 80"    → digits + separator
 *   - "120 delapan"   → dropped "puluh" (means 120 80)
 *   - "120 8"         → dropped zero (means 120 80)
 *   - "seratus dua puluh per delapan puluh" → Indonesian words
 *   - "satu dua nol per delapan nol"        → digit-by-digit words
 *   - "seratus dua puluh delapan puluh"     → words without separator
 *
 * This parser normalizes all of these into systolic/diastolic/pulse.
 */

const ID_NUMBERS: Record<string, number> = {
  nol: 0, kosong: 0,
  satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
  enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
  sepuluh: 10, sebelas: 11,
  'dua belas': 12, 'tiga belas': 13, 'empat belas': 14, 'lima belas': 15,
  'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
  'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 'lima puluh': 50,
  'enam puluh': 60, 'tujuh puluh': 70, 'delapan puluh': 80, 'sembilan puluh': 90,
  seratus: 100,
}

/** Words that separate two numbers ("120 per 80"). */
const SEPARATORS = new Set(['per', 'dari', 'sama', 'dan'])

export interface VoiceParseResult {
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  /** True when only systolic could be recognized (diastolic missing). */
  partial?: boolean
}

/**
 * Extract a flat list of numbers from a transcript.
 *
 * Handles:
 *  - raw digit groups ("120", "8")
 *  - Indonesian digit words that append ("satu dua nol" → 120)
 *  - tens/hundreds that combine additively ("seratus dua puluh" → 120)
 *  - units after tens ("tujuh puluh dua" → 72)
 *  - separators that split into new numbers ("per")
 */
export function extractNumbers(text: string): number[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[.,/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const tokens = cleaned.split(' ')
  const numbers: number[] = []
  let acc = 0
  let prevIsDigit = false
  let lastWasTens = false

  const flush = () => {
    if (acc > 0) {
      numbers.push(acc)
      acc = 0
      prevIsDigit = false
      lastWasTens = false
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!t) continue

    // Separator: current number ends, a new one may begin.
    if (SEPARATORS.has(t)) {
      flush()
      continue
    }

    // Raw digit group ("120") — always its own number.
    if (/^\d+$/.test(t)) {
      flush()
      numbers.push(parseInt(t, 10))
      prevIsDigit = false
      lastWasTens = false
      continue
    }

    // Two-word number first ("dua puluh" → 20).
    let v: number | undefined
    if (i + 1 < tokens.length) {
      v = ID_NUMBERS[`${t} ${tokens[i + 1]}`]
      if (v !== undefined) i++
    }
    if (v === undefined) v = ID_NUMBERS[t]
    if (v === undefined) continue // unknown word — skip

    if (v < 10) {
      // Pure digit word.
      if (lastWasTens) {
        // Units position after tens: "tujuh puluh dua" → 72.
        acc += v
        lastWasTens = false
        prevIsDigit = false
      } else if (prevIsDigit) {
        // Digit-by-digit: "satu dua nol" → 120.
        // BP values never exceed 3 digits, so a 3-digit run means the
        // next digit starts a new number ("satu tiga satu satu satu nol"
        // → 131 then 110).
        if (acc >= 100) {
          numbers.push(acc)
          acc = 0
        }
        acc = acc * 10 + v
      } else {
        flush()
        acc = v
        prevIsDigit = true
      }
    } else if (v === 100) {
      // A "seratus" after a completed number starts a new number
      // ("seratus tiga puluh satu seratus sepuluh" → 131 then 110),
      // not a multiplication.
      if (acc > 0) flush()
      acc = 100
      prevIsDigit = false
      lastWasTens = false
    } else {
      // Tens (10-99): combine additively with preceding hundreds.
      // Two tens groups in a row never form one number in Indonesian
      // ("seratus dua puluh delapan puluh" = 120 and 80, not 200).
      if (lastWasTens) flush()
      acc += v
      prevIsDigit = false
      lastWasTens = true
    }
  }

  flush()
  return numbers
}

const SYSTOLIC_MIN = 50
const SYSTOLIC_MAX = 250
const DIASTOLIC_MIN = 30
const DIASTOLIC_MAX = 150
const PULSE_MIN = 30
const PULSE_MAX = 200

function inRange(v: number, min: number, max: number): boolean {
  return v >= min && v <= max
}

/**
 * Parse a speech transcript into systolic/diastolic/pulse.
 *
 * Heuristics beyond plain extraction:
 *  - A single-digit diastolic (e.g. "120 8") is almost always a dropped
 *    "puluh" — try ×10 ("8" → 80) before giving up.
 *  - A two-digit systolic (e.g. "12 80") is often a dropped zero — try ×10
 *    ("12" → 120) when the raw value is out of range.
 */
export function parseBloodPressureTranscript(text: string): VoiceParseResult {
  const numbers = extractNumbers(text)

  if (numbers.length >= 2) {
    let sys = numbers[0]
    let dia = numbers[1]

    // Dropped "puluh"/zero heuristics (only when raw value is out of range).
    if (!inRange(dia, DIASTOLIC_MIN, DIASTOLIC_MAX) && dia >= 3 && dia <= 15) {
      const x10 = dia * 10
      if (inRange(x10, DIASTOLIC_MIN, DIASTOLIC_MAX)) dia = x10
    }
    if (!inRange(sys, SYSTOLIC_MIN, SYSTOLIC_MAX) && sys >= 5 && sys <= 25) {
      const x10 = sys * 10
      if (inRange(x10, SYSTOLIC_MIN, SYSTOLIC_MAX)) sys = x10
    }

    if (inRange(sys, SYSTOLIC_MIN, SYSTOLIC_MAX) && inRange(dia, DIASTOLIC_MIN, DIASTOLIC_MAX)) {
      const pulseRaw = numbers[2]
      const pulse = pulseRaw !== undefined && inRange(pulseRaw, PULSE_MIN, PULSE_MAX)
        ? pulseRaw
        : null
      return { systolic: sys, diastolic: dia, pulse }
    }
  }

  // Only one number — fill systolic, ask for diastolic.
  if (numbers.length === 1 && inRange(numbers[0], SYSTOLIC_MIN, SYSTOLIC_MAX)) {
    return { systolic: numbers[0], diastolic: null, pulse: null, partial: true }
  }

  return { systolic: null, diastolic: null, pulse: null }
}
