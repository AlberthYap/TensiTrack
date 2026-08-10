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
const mockRpc = vi.fn()
const mockAdminRpc = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mockAdminRpc,
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

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, error: null }),
}))

import {
  addBloodPressureRecord,
  getBloodPressureRecords,
  batchImportBloodPressureRecords,
  updateBloodPressureRecord,
  deleteBloodPressureRecord,
} from '@/app/actions/blood-pressure'
import { checkAuthRateLimit } from '@/lib/rate-limit'

// Guard demo path memerlukan env ini; default di-set agar test demo RPC path
// (hard cap & batch) bisa menjangkau admin client. Test khusus yang mengecek
// perilaku saat key missing menghapus & me-restore env ini sendiri.
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

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

  // DEMO: demo account mutations are rate limited by IP.
  it('returns error when demo user hits rate limit', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const fd = new FormData()
    fd.set('systolic', '120')
    fd.set('diastolic', '80')
    fd.set('measured_at', new Date().toISOString())

    const result = await addBloodPressureRecord(fd)
    expect(result?.error).toMatch(/Batas demo tercapai/)
    expect(checkAuthRateLimit).toHaveBeenCalledWith(
      'demo:record:127.0.0.1',
      expect.any(Number),
      expect.any(Number)
    )
    // Should not reach insert when rate limited
    expect(mockInsert).not.toHaveBeenCalled()
  })

  // DEMO: demo account has hard cap on total records (including soft-deleted).
  // Uses atomic RPC (insert + hard cap check in one DB transaction).
  // SECURITY: RPC hanya boleh dipanggil via admin client (service_role),
  // bukan client user — supaya demo credentials publik tidak bisa bypass
  // rate limit dengan memanggil RPC langsung dari browser.
  it('returns error when demo user reaches hard cap', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    mockAdminRpc.mockResolvedValue({
      data: { error: 'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.' },
      error: null,
    })

    const fd = new FormData()
    fd.set('systolic', '120')
    fd.set('diastolic', '80')
    fd.set('measured_at', new Date().toISOString())

    const result = await addBloodPressureRecord(fd)
    expect(result?.error).toMatch(/Batas demo tercapai/)
    // RPC harus dipanggil via admin client
    expect(mockAdminRpc).toHaveBeenCalledWith('insert_bp_record_atomic', {
      p_user_id: 'demo-1',
      p_systolic: 120,
      p_diastolic: 80,
      p_pulse: null,
      p_category: 'hypertension_stage_1', // 120/80 → 'hypertension_stage_1' per AHA (diastolic ≥80)
      p_notes: null,
      p_measured_at: expect.any(String),
      p_tags: [],
    })
    expect(mockRpc).not.toHaveBeenCalled()
    // Regular insert should not be called for demo users
    expect(mockInsert).not.toHaveBeenCalled()
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

describe('batchImportBloodPressureRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await batchImportBloodPressureRecords([
      { systolic: 120, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
    ])
    expect(result.success).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.errors[0].message).toBe('Unauthorized')
  })

  it('handles empty input array', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await batchImportBloodPressureRecords([])
    expect(result.success).toBe(0)
    expect(result.failed).toBe(0)
  })

  it('returns per-row validation errors for invalid records', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const result = await batchImportBloodPressureRecords([
      { systolic: 999, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
      { systolic: 120, diastolic: 200, pulse: null, measured_at: new Date().toISOString() },
    ])

    expect(result.success).toBe(0)
    expect(result.failed).toBe(2)
    expect(result.errors.length).toBe(2)
    expect(result.errors[0].message).toMatch(/Systolic/)
  })

  it('inserts valid records with correct user_id and categories (regression: batch import)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-456' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const now = new Date().toISOString()
    const result = await batchImportBloodPressureRecords([
      { systolic: 110, diastolic: 70, pulse: 72, measured_at: now },
      { systolic: 135, diastolic: 85, pulse: 80, measured_at: now },
    ])

    expect(result.success).toBe(2)
    expect(result.failed).toBe(0)
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const rows = mockInsert.mock.calls[0][0]
    expect(rows).toHaveLength(2)
    expect(rows[0].user_id).toBe('user-456')
    expect(rows[0].category).toBe('normal')
    expect(rows[1].user_id).toBe('user-456')
    expect(rows[1].category).toBe('hypertension_stage_1')
  })

  it('mixes valid and invalid rows with correct success/failed counts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const result = await batchImportBloodPressureRecords([
      { systolic: 120, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
      { systolic: 999, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
      { systolic: 110, diastolic: 70, pulse: 72, measured_at: new Date().toISOString() },
    ])

    expect(result.success).toBe(2)
    expect(result.failed).toBe(1) // only the 999 systolic row
    expect(result.errors.length).toBe(1)
    expect(result.errors[0].row).toBe(2)
  })

  it('returns all-failed when Supabase insert errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ error: { message: 'Connection refused' } })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const result = await batchImportBloodPressureRecords([
      { systolic: 120, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
    ])

    expect(result.success).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.errors[0].message).toBe('Connection refused')
  })

  it('does NOT call redirect (regression: batch import must not redirect)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    // Should not throw a redirect error
    const result = await batchImportBloodPressureRecords([
      { systolic: 120, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
    ])

    expect(result.success).toBe(1)
    // If redirect was called, an error would have been thrown here
  })

  // DEMO: batch import untuk demo user harus lewat atomic batch RPC via admin
  // client (service_role), bukan insert biasa — sekaligus cek hard cap.
  it('uses admin client atomic RPC for demo user batch import', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })
    mockAdminRpc.mockResolvedValue({ data: { success: true, count: 2 }, error: null })

    const now = new Date().toISOString()
    const result = await batchImportBloodPressureRecords([
      { systolic: 110, diastolic: 70, pulse: null, measured_at: now },
      { systolic: 135, diastolic: 85, pulse: null, measured_at: now },
    ])

    expect(result.success).toBe(2)
    expect(mockAdminRpc).toHaveBeenCalledWith('batch_insert_bp_records_atomic', {
      p_user_id: 'demo-1',
      p_records: [
        {
          systolic: 110,
          diastolic: 70,
          pulse: null,
          category: 'normal', // 110/70 → 'normal' per AHA
          notes: null,
          measured_at: now,
          tags: [],
        },
        {
          systolic: 135,
          diastolic: 85,
          pulse: null,
          category: 'hypertension_stage_1', // 135/85 → 'hypertension_stage_1' per AHA
          notes: null,
          measured_at: now,
          tags: [],
        },
      ],
    })
    // Regular insert tidak boleh dipanggil untuk demo user
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  // DEMO: jika SUPABASE_SERVICE_ROLE_KEY tidak di-set, batch import demo gagal
  // dengan pesan yang jelas (bukan error PostgREST yang membingungkan).
  it('returns clear error when service role key missing for demo batch import', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })
    const saved = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    try {
      const result = await batchImportBloodPressureRecords([
        { systolic: 120, diastolic: 80, pulse: null, measured_at: new Date().toISOString() },
      ])
      expect(result.success).toBe(0)
      expect(result.errors[0].message).toMatch(/Konfigurasi server tidak lengkap/)
      expect(mockAdminRpc).not.toHaveBeenCalled()
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = saved
    }
  })
})

describe('updateBloodPressureRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when demo user hits rate limit', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await updateBloodPressureRecord('record-1', new FormData())
    expect(result?.error).toMatch(/Batas demo tercapai/)
  })
})

describe('deleteBloodPressureRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when demo user hits rate limit', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await deleteBloodPressureRecord('record-1')
    expect(result?.error).toMatch(/Batas demo tercapai/)
  })
})
