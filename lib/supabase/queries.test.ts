import { describe, expect, it, vi } from 'vitest'
import { applyDateRange } from '@/lib/supabase/queries'

describe('applyDateRange', () => {
  // BUG REGRESSION TEST: bug #4 — verify generic typing keeps the chain
  // (no `any` escape hatch). The mock records which methods are called.
  function createMockBuilder() {
    const calls: Array<{ method: string; args: unknown[] }> = []
    const builder: any = {
      gte: vi.fn((col: string, val: unknown) => {
        calls.push({ method: 'gte', args: [col, val] })
        return builder
      }),
      lte: vi.fn((col: string, val: unknown) => {
        calls.push({ method: 'lte', args: [col, val] })
        return builder
      }),
      eq: vi.fn((col: string, val: unknown) => {
        calls.push({ method: 'eq', args: [col, val] })
        return builder
      }),
      is: vi.fn((col: string, val: unknown) => {
        calls.push({ method: 'is', args: [col, val] })
        return builder
      }),
    }
    return { builder, calls }
  }

  it('returns builder unchanged when no options', () => {
    const { builder } = createMockBuilder()
    const result = applyDateRange(builder, {})
    expect(result).toBe(builder)
  })

  // BUG REGRESSION TEST: bug #4 — verify startDate anchored ke awal hari LOKAL.
  // Note: new Date('2024-01-15') di-parse sebagai UTC midnight, lalu
  // .setHours(0,0,0,0) di local TZ menghasilkan ISO string yang berbeda
  // per timezone. Test ini verifikasi invariant: date part of result
  // is 2024-01-15 dan time part is 00:00:00.000 di LOKAL.
  it('applies gte for startDate anchored to 00:00:00.000 local time', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { startDate: '2024-01-15' })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('gte')
    expect(calls[0].args[0]).toBe('measured_at')
    // Get the Date object that was constructed and check its local components
    const d = new Date(calls[0].args[1] as string)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0) // January
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })

  it('applies lte for endDate anchored to 23:59:59.999 local time', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { endDate: '2024-01-15' })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('lte')
    expect(calls[0].args[0]).toBe('measured_at')
    const d = new Date(calls[0].args[1] as string)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getSeconds()).toBe(59)
    expect(d.getMilliseconds()).toBe(999)
  })

  it('applies both gte and lte when both options provided', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { startDate: '2024-01-01', endDate: '2024-01-31' })
    expect(calls).toHaveLength(2)
    expect(calls[0].method).toBe('gte')
    expect(calls[1].method).toBe('lte')
  })

  it('skips empty string startDate (treated as falsy)', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { startDate: '' })
    expect(calls).toHaveLength(0)
  })

  it('preserves builder chain for subsequent .eq / .is calls', () => {
    const { builder, calls } = createMockBuilder()
    const result = applyDateRange(builder, { startDate: '2024-01-01' })
    // Caller can still chain
    result.eq('user_id', 'abc')
    result.is('deleted_at', null)
    expect(calls.map((c) => c.method)).toEqual(['gte', 'eq', 'is'])
  })
})
