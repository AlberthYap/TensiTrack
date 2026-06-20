import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock supabase server client
const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockIs = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__redirect__:${url}`)
  }),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { addBloodPressureRecord, getBloodPressureRecords } from '@/app/actions/blood-pressure'

describe('addBloodPressureRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const fd = new FormData()
    const result = await addBloodPressureRecord(fd)
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns validation error for invalid systolic', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const fd = new FormData()
    fd.set('systolic', '999') // out of range
    fd.set('diastolic', '80')
    fd.set('measured_at', new Date().toISOString())
    const result = await addBloodPressureRecord(fd)
    expect(result?.error).toMatch(/Systolic/)
  })

  // BUG REGRESSION TEST: bug #2 — verify user_id is set on insert
  it('inserts with user_id from authenticated user (regression: bug #2)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const fd = new FormData()
    // 110/70 = 'normal' per AHA guidelines (systolic < 120 AND diastolic < 80)
    fd.set('systolic', '110')
    fd.set('diastolic', '70')
    fd.set('pulse', '72')
    fd.set('measured_at', new Date().toISOString())

    try {
      await addBloodPressureRecord(fd)
    } catch (e) {
      // expected redirect
      if (!(e instanceof Error) || !e.message.startsWith('__redirect__')) throw e
    }

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.user_id).toBe('user-123')
    expect(insertArg.systolic).toBe(110)
    expect(insertArg.diastolic).toBe(70)
    expect(insertArg.category).toBe('normal') // 110/70 → 'normal'
  })

  it('returns error when insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const fd = new FormData()
    fd.set('systolic', '120')
    fd.set('diastolic', '80')
    fd.set('measured_at', new Date().toISOString())

    const result = await addBloodPressureRecord(fd)
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('getBloodPressureRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getBloodPressureRecords()
    expect(result).toEqual([])
  })

  // BUG REGRESSION TEST: bug #2 — defense-in-depth, query MUST filter by user_id
  it('filters by user_id (regression: bug #2 missing user_id filter)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-456' } } })

    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    const mockIs = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ is: mockIs }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    mockFrom.mockReturnValue({ select: mockSelect })

    await getBloodPressureRecords()

    // The user_id filter MUST be applied
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456')
  })

  it('excludes soft-deleted records (deleted_at IS NULL)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockIs = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ is: mockIs }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    mockFrom.mockReturnValue({ select: mockSelect })

    await getBloodPressureRecords()

    // deleted_at IS NULL filter must be applied
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
  })

  it('returns empty array on error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'fail' },
    })
    const mockIs = vi.fn(() => ({ order: mockOrder }))
    const mockEq = vi.fn(() => ({ is: mockIs }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await getBloodPressureRecords()
    expect(result).toEqual([])
  })
})
