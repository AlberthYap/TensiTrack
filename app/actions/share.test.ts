import { beforeEach, describe, expect, it, vi } from 'vitest'

// Build a shared mock client that we can mutate per-test
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}))

import { validateShareToken } from '@/app/actions/share'

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
