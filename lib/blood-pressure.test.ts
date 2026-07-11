import { describe, expect, it } from 'vitest'
import {
  CATEGORY_LABELS,
  calculateCategory,
  formatBloodPressure,
  getCategoryInfo,
  getTrend,
} from '@/lib/blood-pressure'

describe('calculateCategory', () => {
  describe('AHA blood pressure classification', () => {
    it('returns "low" when systolic < 90', () => {
      expect(calculateCategory(85, 70)).toBe('low')
    })

    it('returns "low" when diastolic < 60', () => {
      expect(calculateCategory(110, 55)).toBe('low')
    })

    it('returns "hypertension_stage_2" when systolic >= 140', () => {
      expect(calculateCategory(140, 80)).toBe('hypertension_stage_2')
      expect(calculateCategory(180, 95)).toBe('hypertension_stage_2')
    })

    it('returns "hypertension_stage_2" when diastolic >= 90', () => {
      expect(calculateCategory(120, 90)).toBe('hypertension_stage_2')
      expect(calculateCategory(135, 100)).toBe('hypertension_stage_2')
    })

    it('returns "hypertension_stage_1" when systolic 130-139', () => {
      expect(calculateCategory(130, 75)).toBe('hypertension_stage_1')
      expect(calculateCategory(139, 79)).toBe('hypertension_stage_1')
    })

    it('returns "hypertension_stage_1" when diastolic 80-89', () => {
      expect(calculateCategory(125, 80)).toBe('hypertension_stage_1')
      expect(calculateCategory(120, 89)).toBe('hypertension_stage_1')
    })

    it('returns "elevated" when systolic 120-129 AND diastolic < 80', () => {
      expect(calculateCategory(120, 75)).toBe('elevated')
      expect(calculateCategory(125, 79)).toBe('elevated')
      expect(calculateCategory(129, 70)).toBe('elevated')
    })

    it('returns "normal" for healthy range (systolic <120 AND diastolic <80)', () => {
      expect(calculateCategory(110, 70)).toBe('normal')
      expect(calculateCategory(115, 75)).toBe('normal')
      expect(calculateCategory(119, 79)).toBe('normal')
    })

    it('handles edge case at systolic=90 (boundary)', () => {
      // systolic=90, diastolic=60 → not low, not stage 2, not stage 1, not elevated, normal
      expect(calculateCategory(90, 60)).toBe('normal')
    })

    it('handles edge case at systolic=119, diastolic=80', () => {
      // systolic < 120 (normal) BUT diastolic >= 80 (stage 1) → stage 1 wins
      expect(calculateCategory(119, 80)).toBe('hypertension_stage_1')
    })

    it('uses higher category (AHA rule): low SBP < 90 but stage 1 DBP returns stage 1', () => {
      // Regression: previously returned 'low' which violated AHA's
      // "use higher category" rule when DBP is in stage 1 range.
      expect(calculateCategory(89, 80)).toBe('hypertension_stage_1')
      expect(calculateCategory(85, 85)).toBe('hypertension_stage_1')
    })

    it('uses higher category (AHA rule): low SBP < 90 but stage 2 DBP returns stage 2', () => {
      // Regression: previously returned 'low' when DBP >= 90
      expect(calculateCategory(85, 95)).toBe('hypertension_stage_2')
      expect(calculateCategory(70, 110)).toBe('hypertension_stage_2')
    })

    it('uses higher category (AHA rule): aggressively low SBP 80 + stage 1 DBP 85 still returns stage 1', () => {
      // Symmetric regression test mirroring (89, 80) — documents AHA "use higher category"
      // rule from a deeper hypotension SBP. DBP=85 must win over SBP=80.
      expect(calculateCategory(80, 85)).toBe('hypertension_stage_1')
    })
  })
})

describe('getCategoryInfo', () => {
  it('returns Indonesian label for each category', () => {
    expect(getCategoryInfo('low').label).toBe('Rendah')
    expect(getCategoryInfo('normal').label).toBe('Normal')
    expect(getCategoryInfo('elevated').label).toBe('Meningkat')
    expect(getCategoryInfo('hypertension_stage_1').label).toBe('Hipertensi Tahap 1')
    expect(getCategoryInfo('hypertension_stage_2').label).toBe('Hipertensi Tahap 2')
  })

  it('returns complete info with color, description, recommendation', () => {
    const info = getCategoryInfo('hypertension_stage_2')
    expect(info).toHaveProperty('color')
    expect(info).toHaveProperty('bgColor')
    expect(info).toHaveProperty('borderColor')
    expect(info).toHaveProperty('textColor')
    expect(info).toHaveProperty('description')
    expect(info).toHaveProperty('recommendation')
    expect(info.description).toContain('dokter')
  })
})

describe('CATEGORY_LABELS', () => {
  it('has labels for all 5 categories', () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(5)
    expect(CATEGORY_LABELS.low).toBeTruthy()
    expect(CATEGORY_LABELS.normal).toBeTruthy()
    expect(CATEGORY_LABELS.elevated).toBeTruthy()
    expect(CATEGORY_LABELS.hypertension_stage_1).toBeTruthy()
    expect(CATEGORY_LABELS.hypertension_stage_2).toBeTruthy()
  })
})

describe('formatBloodPressure', () => {
  it('formats as systolic/diastolic', () => {
    expect(formatBloodPressure(120, 80)).toBe('120/80')
    expect(formatBloodPressure(140, 90)).toBe('140/90')
  })
})

describe('getTrend', () => {
  it('returns "stable" when diff < 5 mmHg', () => {
    expect(getTrend(120, 118)).toBe('stable')
    expect(getTrend(120, 122)).toBe('stable')
    expect(getTrend(120, 120)).toBe('stable')
  })

  it('returns "up" when current is >= 5 mmHg higher', () => {
    expect(getTrend(125, 120)).toBe('up')
    expect(getTrend(140, 120)).toBe('up')
  })

  it('returns "down" when current is >= 5 mmHg lower', () => {
    expect(getTrend(115, 120)).toBe('down')
    expect(getTrend(100, 120)).toBe('down')
  })

  it('uses absolute difference (handles lower→higher equally)', () => {
    expect(getTrend(120, 115)).toBe('up')
    expect(getTrend(120, 125)).toBe('down')
  })
})
