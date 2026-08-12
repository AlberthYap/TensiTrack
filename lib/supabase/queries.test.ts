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

  // Asia/Jakarta midnight is the previous day's 17:00 UTC.
  it('applies gte for startDate anchored to Asia/Jakarta midnight', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { startDate: '2024-01-15' })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('gte')
    expect(calls[0].args[0]).toBe('measured_at')
    expect(calls[0].args[1]).toBe('2024-01-14T17:00:00.000Z')
  })

  it('applies lte for endDate anchored to Asia/Jakarta end of day', () => {
    const { builder, calls } = createMockBuilder()
    applyDateRange(builder, { endDate: '2024-01-15' })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('lte')
    expect(calls[0].args[0]).toBe('measured_at')
    expect(calls[0].args[1]).toBe('2024-01-15T16:59:59.999Z')
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
