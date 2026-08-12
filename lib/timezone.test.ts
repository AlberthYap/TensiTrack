import { describe, expect, it } from 'vitest'
import {
  addAppDateDays,
  appDateTimeToUtc,
  getAppDateKey,
  getAppDayEndUtc,
  getAppDayStartUtc,
  getAppHour,
} from '@/lib/timezone'

describe('Asia/Jakarta timezone helpers', () => {
  it('uses the local Jakarta date around midnight boundaries', () => {
    expect(getAppDateKey('2024-01-14T16:59:59.999Z')).toBe('2024-01-14')
    expect(getAppDateKey('2024-01-14T17:00:00.000Z')).toBe('2024-01-15')
    expect(getAppHour('2024-01-14T17:00:00.000Z')).toBe(0)
  })

  it('converts Jakarta day boundaries to UTC', () => {
    expect(getAppDayStartUtc('2024-01-15')).toBe('2024-01-14T17:00:00.000Z')
    expect(getAppDayEndUtc('2024-01-15')).toBe('2024-01-15T16:59:59.999Z')
  })

  it('converts a local Jakarta datetime to the correct UTC instant', () => {
    expect(appDateTimeToUtc('2024-01-15', '00:30:00.000')?.toISOString())
      .toBe('2024-01-14T17:30:00.000Z')
  })

  it('adds calendar days without using the server timezone', () => {
    expect(addAppDateDays('2024-01-01', 31)).toBe('2024-02-01')
    expect(addAppDateDays('2024-03-01', -1)).toBe('2024-02-29')
  })
})
