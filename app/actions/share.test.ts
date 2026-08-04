import { beforeEach, describe, expect, it, vi } from 'vitest'

// Service role key needed by demo share token generation (admin client + atomic RPC)
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Build a shared mock client that we can mutate per-test
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockInsert = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  getClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, error: null }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/share-internal-queries', () => ({
  getMonthlyStatsByUserId: vi.fn().mockResolvedValue(null),
  getRecordsByUserId: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    error: null,
  }),
  get30DayChartDataByUserId: vi.fn().mockResolvedValue([]),
  getCategoryStatsByUserId: vi.fn().mockResolvedValue({ total: 0, items: [] }),
  getTrendComparisonByUserId: vi.fn().mockResolvedValue({
    current: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    previous: { startDate: '', endDate: '', averageSystolic: 0, averageDiastolic: 0, readingCount: 0 },
    systolicChange: 0,
    diastolicChange: 0,
    systolicTrend: 'stable',
    diastolicTrend: 'stable',
  }),
}))

import {
  validateShareToken,
  generateShareToken,
  revokeShareToken,
  deleteShareToken,
  getMonthlyStatsByShareToken,
} from '@/app/actions/share'
import { checkAuthRateLimit } from '@/lib/rate-limit'

describe('validateShareToken', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  // BUG REGRESSION TEST: bug #1 — validateShareToken should be the SINGLE
  // entry that increments view_count via atomic RPC and handle all statuses.

  it('returns error for "not_found" RPC status', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: null,
          user_id: null,
          token: null,
          expires_at: null,
          is_active: null,
          view_count: null,
          max_views: null,
          created_at: null,
          updated_at: null,
          status: 'not_found',
        },
      ],
      error: null,
    })

    const result = await validateShareToken('missing-token')
    expect(result.error).toBe('Invalid or expired token')
    expect(result.data).toBeNull()
  })

  it('returns error for "expired" RPC status', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'tok-1',
          user_id: 'u-1',
          token: 't',
          expires_at: '2020-01-01',
          is_active: false,
          view_count: 5,
          max_views: null,
          created_at: '2020-01-01',
          updated_at: '2020-01-01',
          status: 'expired',
        },
      ],
      error: null,
    })

    const result = await validateShareToken('expired-token')
    expect(result.error).toBe('Token has expired')
    expect(result.data).toBeNull()
  })

  it('returns error for "inactive" RPC status', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'tok-1',
          user_id: 'u-1',
          token: 't',
          expires_at: null,
          is_active: false,
          view_count: 5,
          max_views: null,
          created_at: '',
          updated_at: '',
          status: 'inactive',
        },
      ],
      error: null,
    })

    const result = await validateShareToken('inactive-token')
    expect(result.error).toBe('Token sudah tidak aktif')
    expect(result.data).toBeNull()
  })

  it('returns error for "max_views_reached" RPC status', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'tok-1',
          user_id: 'u-1',
          token: 't',
          expires_at: null,
          is_active: true,
          view_count: 10,
          max_views: 10,
          created_at: '',
          updated_at: '',
          status: 'max_views_reached',
        },
      ],
      error: null,
    })

    const result = await validateShareToken('full-token')
    expect(result.error).toBe('Token has reached maximum views')
    expect(result.data).toBeNull()
  })

  it('returns token data and increments view_count on "ok" status', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'tok-1',
          user_id: 'user-123',
          token: 'valid-token',
          expires_at: null,
          is_active: true,
          view_count: 7, // incremented from 6 to 7 atomically
          max_views: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-15',
          status: 'ok',
        },
      ],
      error: null,
    })

    const result = await validateShareToken('valid-token')
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.user_id).toBe('user-123')
    expect(result.data?.view_count).toBe(7)
    // CRITICAL: must call the atomic RPC
    expect(mockRpc).toHaveBeenCalledWith('increment_share_token_view', {
      p_token: 'valid-token',
    })
  })

  it('returns error when RPC call itself errors', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'connection refused' },
    })

    const result = await validateShareToken('any-token')
    expect(result.error).toBe('connection refused')
    expect(result.data).toBeNull()
  })
})

describe('shareToken demo rate limiting', () => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn()
  const mockCountEq = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({
      data: { id: 'share-1', token: 'abc123' },
      error: null,
    })
    // Supabase query builder pattern: select().eq(...).eq(...)
    mockCountEq.mockResolvedValue({ count: 0, error: null })
    mockSelect.mockReturnValue({
      single: mockSingle,
      eq: vi.fn().mockImplementation(() => ({
        eq: mockCountEq,
        single: mockSingle,
      })),
    })
    mockInsert.mockReturnValue({ select: mockSelect })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect,
    })
  })

  it('returns error when demo user hits rate limit on generate', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await generateShareToken(7, 5)
    expect(result?.error).toMatch(/Batas demo tercapai/)
    expect(checkAuthRateLimit).toHaveBeenCalledWith(
      'demo:share:127.0.0.1',
      expect.any(Number),
      expect.any(Number)
    )
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns error when demo user hits rate limit on revoke', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await revokeShareToken('token-id-1')
    expect(result?.error).toMatch(/Batas demo tercapai/)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error when demo user hits rate limit on delete', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValueOnce({ allowed: false, error: null })
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await deleteShareToken('token-id-1')
    expect(result?.error).toMatch(/Batas demo tercapai/)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('allows demo user to create share token when under rate limit', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    mockRpc.mockResolvedValueOnce({
      data: { success: true, id: 'new-share-1' },
      error: null,
    })

    const result = await generateShareToken(7, 5)
    expect(result?.error).toBeUndefined()
    // Demo users use atomic RPC via admin client, not regular insert
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('create_share_token_atomic', {
      p_user_id: 'demo-1',
      p_token: expect.any(String),
      p_expires_at: expect.any(String),
      p_max_views: 5,
    })
  })

  it('does not apply demo rate limit for regular users', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })

    const result = await generateShareToken(7, 5)
    expect(result?.error).toBeUndefined()
    expect(checkAuthRateLimit).not.toHaveBeenCalled()
    // Regular users use standard insert
    expect(mockInsert).toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('returns error when demo user reaches hard cap on active share tokens', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    // Atomic RPC returns hard cap error
    mockRpc.mockResolvedValueOnce({
      data: { error: 'Batas demo tercapai. Silakan buat akun gratis untuk melanjutkan.' },
      error: null,
    })

    const result = await generateShareToken(7, 5)
    expect(result?.error).toMatch(/Batas demo tercapai/)
    expect(mockInsert).not.toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('create_share_token_atomic', {
      p_user_id: 'demo-1',
      p_token: expect.any(String),
      p_expires_at: expect.any(String),
      p_max_views: 5,
    })
  })

  it('returns error when demo user RPC fails at the database level', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'database connection error' },
    })

    const result = await generateShareToken(7, 5)
    expect(result?.error).toBe('database connection error')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns config error when SUPABASE_SERVICE_ROLE_KEY is unset for demo', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const saved = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    try {
      const result = await generateShareToken(7, 5)
      expect(result?.error).toMatch(/Konfigurasi server tidak lengkap/)
      expect(mockInsert).not.toHaveBeenCalled()
      expect(mockRpc).not.toHaveBeenCalled()
    } finally {
      if (saved) process.env.SUPABASE_SERVICE_ROLE_KEY = saved
    }
  })
})

describe('shareToken internal getters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'tok-1',
        user_id: 'user-123',
        token: 'valid-token',
        expires_at: null,
        is_active: true,
        view_count: 7,
        max_views: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ single: mockSingle }),
    })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('does not increment view_count when using internal getters', async () => {
    await getMonthlyStatsByShareToken('valid-token')
    // Internal getters harusnya memakai resolveShareToken, bukan validateShareToken,
    // sehingga RPC increment_share_token_view tidak boleh dipanggil.
    expect(mockRpc).not.toHaveBeenCalled()
  })
})
