import { describe, expect, it } from 'vitest'
import { generateTrendInsights, generatePatternInsights } from '@/lib/insights'
import type { TrendComparison, BloodPressureRecord } from '@/types/blood-pressure.types'

function makeComparison(
  overrides: Partial<TrendComparison> = {}
): TrendComparison {
  return {
    current: {
      startDate: '2026-07-04',
      endDate: '2026-07-11',
      averageSystolic: 120,
      averageDiastolic: 78,
      readingCount: 7,
    },
    previous: {
      startDate: '2026-06-27',
      endDate: '2026-07-03',
      averageSystolic: 120,
      averageDiastolic: 78,
      readingCount: 7,
    },
    systolicChange: 0,
    diastolicChange: 0,
    systolicTrend: 'stable',
    diastolicTrend: 'stable',
    ...overrides,
  }
}

describe('generateTrendInsights', () => {
  it('returns no-data insight when current period has zero readings', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, readingCount: 0 },
    })
    const result = generateTrendInsights(c)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('no-data')
    expect(result[0].tone).toBe('neutral')
  })

  it('returns first-period insight when previous had zero readings', () => {
    const c = makeComparison({
      previous: { ...makeComparison().previous, readingCount: 0 },
      current: { ...makeComparison().current, readingCount: 5 },
    })
    const result = generateTrendInsights(c)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('first-period')
    expect(result[0].tone).toBe('positive')
  })

  it('returns positive stable insight when trend is stable at normal range', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 115,
        averageDiastolic: 75,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 115,
        averageDiastolic: 75,
      },
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('stable')
    expect(result[0].tone).toBe('positive')
  })

  it('returns attention stable insight when trend stable but at stage 2', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 145,
        averageDiastolic: 95,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 145,
        averageDiastolic: 95,
      },
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('stable')
    expect(result[0].tone).toBe('attention')
    expect(result[0].title).toMatch(/masih tinggi/)
    expect(result[0].body).toMatch(/dokter/)
  })

  it('returns caution insight when systolic rose ≥ 5 mmHg at elevated range', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 125,
        averageDiastolic: 78,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 119,
        averageDiastolic: 79,
      },
      systolicChange: 6,
      systolicTrend: 'up',
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('trend-change')
    expect(result[0].tone).toBe('caution')
    expect(result[0].title).toMatch(/naik/)
    expect(result[0].title).toMatch(/6 mmHg/)
  })

  it('returns attention insight when systolic rose and current is at stage 1', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 138,
        averageDiastolic: 85,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 130,
        averageDiastolic: 80,
      },
      systolicChange: 8,
      systolicTrend: 'up',
    })
    const result = generateTrendInsights(c)
    expect(result[0].tone).toBe('attention')
    expect(result[0].body).toMatch(/dokter|kontrol/)
  })

  it('returns positive insight when both systolic and diastolic dropped', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 124,
        averageDiastolic: 76,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 130,
        averageDiastolic: 82,
      },
      systolicChange: -6,
      diastolicChange: -6,
      systolicTrend: 'down',
      diastolicTrend: 'down',
    })
    const result = generateTrendInsights(c)
    expect(result[0].tone).toBe('positive')
    expect(result[0].title).toMatch(/turun/)
  })

  it('skips frequency-drop when previous readingCount < 5', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, readingCount: 1 },
      previous: { ...makeComparison().previous, readingCount: 3 },
    })
    const result = generateTrendInsights(c)
    expect(result.some((i) => i.id === 'freq-drop')).toBe(false)
  })

  it('adds frequency-drop insight when previous ≥ 5 and current < 70%', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, readingCount: 3 },
      previous: { ...makeComparison().previous, readingCount: 8 },
    })
    const result = generateTrendInsights(c)
    expect(result.some((i) => i.id === 'freq-drop')).toBe(true)
  })

  it('caps returned insights at 2', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 142,
        averageDiastolic: 92,
        readingCount: 3,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 130,
        averageDiastolic: 82,
        readingCount: 12,
      },
      systolicChange: 12,
      diastolicChange: 10,
      systolicTrend: 'up',
      diastolicTrend: 'up',
    })
    const result = generateTrendInsights(c)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('combines sys+dia into a single insight when both change', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 130,
        averageDiastolic: 85,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 124,
        averageDiastolic: 79,
      },
      systolicChange: 6,
      diastolicChange: 6,
      systolicTrend: 'up',
      diastolicTrend: 'up',
    })
    const result = generateTrendInsights(c)
    expect(result.filter((i) => i.id === 'trend-change').length).toBe(1)
    expect(result[0].title).toMatch(/sistolik.*diastolik/i)
  })

  it('produces a single insight when only systolic changes', () => {
    const c = makeComparison({
      current: {
        ...makeComparison().current,
        averageSystolic: 132,
        averageDiastolic: 78,
      },
      previous: {
        ...makeComparison().previous,
        averageSystolic: 125,
        averageDiastolic: 78,
      },
      systolicChange: 7,
      diastolicChange: 0,
      systolicTrend: 'up',
      diastolicTrend: 'stable',
    })
    const result = generateTrendInsights(c)
    expect(result.filter((i) => i.id === 'trend-change').length).toBe(1)
    expect(result[0].title).toMatch(/sistolik naik 7 mmHg/i)
    expect(result[0].title).not.toMatch(/diastolik/)
  })
})

describe('generateTrendInsights boundary cases', () => {
  it('treats +5 mmHg systolic change as significant (inclusive boundary)', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, averageSystolic: 125, averageDiastolic: 80 },
      previous: { ...makeComparison().previous, averageSystolic: 120, averageDiastolic: 80 },
      systolicChange: 5,
      systolicTrend: 'up',
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('trend-change')
    expect(result[0].title).toMatch(/naik.*5 mmHg/)
  })

  it('treats -5 mmHg systolic change as significant (inclusive boundary)', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, averageSystolic: 115, averageDiastolic: 80 },
      previous: { ...makeComparison().previous, averageSystolic: 120, averageDiastolic: 80 },
      systolicChange: -5,
      systolicTrend: 'down',
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('trend-change')
  })

  it('treats +4 mmHg systolic change as stable (below threshold)', () => {
    const c = makeComparison({
      current: { ...makeComparison().current, averageSystolic: 124, averageDiastolic: 80 },
      previous: { ...makeComparison().previous, averageSystolic: 120, averageDiastolic: 80 },
      systolicChange: 4,
      systolicTrend: 'stable',
    })
    const result = generateTrendInsights(c)
    expect(result[0].id).toBe('stable')
  })
})

// ---------------------------------------------------------------------------
// generatePatternInsights tests
// ---------------------------------------------------------------------------

function makeRecord(overrides: Partial<BloodPressureRecord> = {}): BloodPressureRecord {
  return {
    id: 'r-1',
    user_id: 'u-1',
    systolic: 120,
    diastolic: 80,
    pulse: null,
    category: 'normal',
    notes: null,
    measured_at: new Date('2026-08-04T07:00:00Z').toISOString(),
    created_at: new Date('2026-08-04T07:00:00Z').toISOString(),
    updated_at: new Date('2026-08-04T07:00:00Z').toISOString(),
    deleted_at: null,
    ...overrides,
  } as BloodPressureRecord
}

describe('generatePatternInsights', () => {
  it('returns empty array for no records', () => {
    expect(generatePatternInsights([])).toHaveLength(0)
  })

  it('returns empty when neither morning nor evening has enough readings', () => {
    const records = [
      makeRecord({ measured_at: '2026-08-04T07:00:00Z', systolic: 120, diastolic: 80 }),
      makeRecord({ measured_at: '2026-08-04T12:00:00Z', systolic: 122, diastolic: 82 }), // noon — ignored
    ]
    const result = generatePatternInsights(records)
    // Only 1 morning, no evening — not enough for morning-evening comparison
    // 2 unique days? Actually both are same day
    expect(result.filter((i) => i.id === 'morning-evening')).toHaveLength(0)
  })

  it('detects morning-vs-evening difference when both have ≥ 3 readings', () => {
    const records = [
      // 3 morning readings (07:00)
      makeRecord({ measured_at: '2026-08-02T07:00:00Z', systolic: 130, diastolic: 85 }),
      makeRecord({ measured_at: '2026-08-03T07:00:00Z', systolic: 132, diastolic: 86 }),
      makeRecord({ measured_at: '2026-08-04T07:00:00Z', systolic: 128, diastolic: 84 }),
      // 3 evening readings (18:00)
      makeRecord({ measured_at: '2026-08-02T18:00:00Z', systolic: 118, diastolic: 76 }),
      makeRecord({ measured_at: '2026-08-03T18:00:00Z', systolic: 120, diastolic: 78 }),
      makeRecord({ measured_at: '2026-08-04T18:00:00Z', systolic: 116, diastolic: 74 }),
    ]
    const result = generatePatternInsights(records)
    const me = result.find((i) => i.id === 'morning-evening')
    expect(me).toBeDefined()
    expect(me!.title).toMatch(/lebih tinggi/)
    expect(me!.body).toMatch(/pagi.*malam/)
  })

  it('returns few-days insight when only 3 or fewer unique days tracked', () => {
    const records = [
      makeRecord({ measured_at: '2026-08-04T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-04T18:00:00Z' }),
      makeRecord({ measured_at: '2026-08-04T20:00:00Z' }),
      makeRecord({ measured_at: '2026-08-03T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-02T07:00:00Z' }),
    ]
    const result = generatePatternInsights(records)
    const fd = result.find((i) => i.id === 'few-days')
    expect(fd).toBeDefined()
    expect(fd!.title).toMatch(/3.*7.*hari/)
  })

  it('returns few-days with correct count for all 7 days', () => {
    const records = [
      makeRecord({ measured_at: '2026-08-01T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-02T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-03T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-04T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-05T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-06T07:00:00Z' }),
      makeRecord({ measured_at: '2026-08-07T07:00:00Z' }),
    ]
    const result = generatePatternInsights(records)
    // 7 unique days → no few-days insight
    expect(result.find((i) => i.id === 'few-days')).toBeUndefined()
  })

  it('caps output at 2 insights', () => {
    // Many morning + evening + few days — should cap
    const records = Array.from({ length: 10 }, (_, i) => {
      const day = 1 + Math.floor(i / 2) // 2 readings per day, 5 days
      return makeRecord({
        measured_at: `2026-07-${String(30 + day).padStart(2, '0')}T0${7 + (i % 2) * 11}:00:00Z`,
        systolic: 120 + i,
        diastolic: 80 + (i % 3),
      })
    })
    expect(generatePatternInsights(records).length).toBeLessThanOrEqual(2)
  })
})

// Re-export for test file clarity
export {}
