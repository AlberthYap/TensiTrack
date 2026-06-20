import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatRelativeTime, formatTime } from '@/lib/date'

describe('formatDate', () => {
  it('formats valid ISO string to Indonesian date', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/15/)
  })

  it('accepts Date object', () => {
    const d = new Date(2024, 0, 15) // 15 Jan 2024
    const result = formatDate(d)
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })

  // BUG REGRESSION TEST: invalid date strings should NOT crash (return '-' instead)
  it('returns "-" for invalid date string (regression: bug #11)', () => {
    expect(formatDate('not-a-date')).toBe('-')
    expect(formatDate('')).toBe('-')
    expect(formatDate('2024-13-45')).toBe('-')
  })

  it('returns "-" for null/undefined', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns "-" for Invalid Date object', () => {
    expect(formatDate(new Date('invalid'))).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('formats valid datetime with time component', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })

  it('returns "-" for invalid input (regression: bug #11)', () => {
    expect(formatDateTime('not-a-date')).toBe('-')
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
  })
})

describe('formatTime', () => {
  it('formats to HH:mm', () => {
    const result = formatTime('2024-01-15T10:30:00Z')
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('returns "-" for invalid input (regression: bug #11)', () => {
    expect(formatTime('not-a-date')).toBe('-')
    expect(formatTime(null)).toBe('-')
  })
})

describe('formatRelativeTime', () => {
  it('returns relative time string for valid date', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(oneDayAgo)
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('-')
  })

  it('returns "-" for invalid input (regression: bug #11)', () => {
    expect(formatRelativeTime('not-a-date')).toBe('-')
    expect(formatRelativeTime(null)).toBe('-')
    expect(formatRelativeTime(undefined)).toBe('-')
  })
})
