import { describe, expect, it } from 'vitest'
import {
  MAX_IMPORT_ROWS,
  detectColumns,
  parseCsv,
  parseCsvImport,
} from '@/lib/csv-import'

describe('parseCsv', () => {
  it('parses simple CSV', () => {
    const result = parseCsv('a,b,c\n1,2,3')
    expect(result).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields with commas', () => {
    const result = parseCsv('name,note\n"Doe, John","hello, world"')
    expect(result).toEqual([
      ['name', 'note'],
      ['Doe, John', 'hello, world'],
    ])
  })

  it('handles escaped double-quotes', () => {
    const result = parseCsv('note\n"He said ""hi"""')
    expect(result).toEqual([['note'], ['He said "hi"']])
  })

  it('normalizes CRLF and CR to LF', () => {
    const result = parseCsv('a,b\r\nc,d\r\ne,f')
    expect(result).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ])
  })

  it('filters empty rows', () => {
    const result = parseCsv('a,b\n\n1,2\n\n')
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('detectColumns', () => {
  it('detects English column names', () => {
    const map = detectColumns(['systolic', 'diastolic', 'measured_at', 'pulse', 'notes'])
    expect(map).toEqual({
      systolic: 0,
      diastolic: 1,
      measured_at: 2,
      pulse: 3,
      notes: 4,
    })
  })

  it('detects Indonesian column names', () => {
    const map = detectColumns(['Sistolik', 'Diastolik', 'Tanggal', 'Nadi', 'Catatan'])
    expect(map).toEqual({
      systolic: 0,
      diastolic: 1,
      measured_at: 2,
      pulse: 3,
      notes: 4,
    })
  })

  it('returns null if required columns missing', () => {
    const map = detectColumns(['systolic', 'diastolic'])
    expect(map).toBeNull()
  })

  it('makes pulse and notes optional', () => {
    const map = detectColumns(['sistolik', 'diastolik', 'date'])
    expect(map).toEqual({
      systolic: 0,
      diastolic: 1,
      measured_at: 2,
    })
    expect(map?.pulse).toBeUndefined()
    expect(map?.notes).toBeUndefined()
  })
})

describe('parseCsvImport', () => {
  const validCsv =
    'sistolik,diastolik,tanggal,nadi,catatan\n' +
    '120,80,2024-01-15,72,pagi\n' +
    '130,85,2024-01-16,75,siang\n' +
    '110,70,2024-01-17,68,malam\n'

  it('parses valid CSV with all rows', () => {
    const result = parseCsvImport(validCsv)
    expect(result.validRows).toHaveLength(3)
    expect(result.errors).toHaveLength(0)
    expect(result.truncated).toBe(false)
  })

  it('handles empty CSV', () => {
    const result = parseCsvImport('')
    expect(result.validRows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles CSV with only header', () => {
    const result = parseCsvImport('sistolik,diastolik,tanggal\n')
    expect(result.validRows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects CSV without required columns', () => {
    const result = parseCsvImport('foo,bar\n1,2')
    expect(result.validRows).toHaveLength(0)
    expect(result.errors[0].message).toMatch(/Header/)
  })

  it('records per-row errors for invalid rows', () => {
    const csv =
      'sistolik,diastolik,tanggal\n' +
      '120,80,2024-01-15\n' + // valid
      'abc,80,2024-01-16\n' + // non-numeric systolic
      '120,80,bad-date\n' + // bad date
      '120,80,2024-01-17\n' // valid
    const result = parseCsvImport(csv)
    expect(result.validRows).toHaveLength(2)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('rejects out-of-range values', () => {
    const csv = 'sistolik,diastolik,tanggal\n1000,80,2024-01-15'
    const result = parseCsvImport(csv)
    expect(result.validRows).toHaveLength(0)
    expect(result.errors[0].message).toMatch(/rentang/)
  })

  // BUG REGRESSION TEST: bug #6 — DoS protection, MAX_IMPORT_ROWS
  describe('DoS protection (regression: bug #6)', () => {
    it('truncates to MAX_IMPORT_ROWS', () => {
      // Build CSV with 1500 rows (>MAX_IMPORT_ROWS=1000)
      let csv = 'sistolik,diastolik,tanggal\n'
      for (let i = 0; i < 1500; i++) {
        csv += `120,80,2024-01-15\n`
      }
      const result = parseCsvImport(csv)
      expect(result.validRows).toHaveLength(MAX_IMPORT_ROWS)
      expect(result.truncated).toBe(true)
      expect(result.totalRows).toBe(1500)
    })

    it('emits truncation error message', () => {
      let csv = 'sistolik,diastolik,tanggal\n'
      for (let i = 0; i < 1500; i++) {
        csv += `120,80,2024-01-15\n`
      }
      const result = parseCsvImport(csv)
      const truncationError = result.errors.find((e) => e.message.includes('melebihi'))
      expect(truncationError).toBeDefined()
    })

    it('does not truncate when at or below limit', () => {
      let csv = 'sistolik,diastolik,tanggal\n'
      for (let i = 0; i < 500; i++) {
        csv += `120,80,2024-01-15\n`
      }
      const result = parseCsvImport(csv)
      expect(result.validRows).toHaveLength(500)
      expect(result.truncated).toBe(false)
    })
  })
})
