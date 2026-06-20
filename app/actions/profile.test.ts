import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock supabase server client
const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
    from: mockFrom,
  }),
}))

const mockAdminDeleteUser = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUser,
      },
    },
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__redirect__:${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { deleteAccount } from '@/app/actions/profile'

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns Unauthorized when user not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await deleteAccount('HAPUS AKUN')
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns error when confirmation text is wrong', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const result = await deleteAccount('salah')
    expect(result?.error).toMatch(/Konfirmasi tidak valid/)
  })

  it('deletes user via admin client on valid confirmation', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-789' } } })
    mockAdminDeleteUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    try {
      await deleteAccount('HAPUS AKUN')
    } catch (e) {
      // expected redirect to /?deleted=1
      if (e instanceof Error && e.message.startsWith('__redirect__:/?deleted=1')) {
        // ok
      } else {
        throw e
      }
    }

    expect(mockAdminDeleteUser).toHaveBeenCalledWith('user-789')
  })

  // BUG REGRESSION TEST: bug #15 — when admin delete FAILS, do NOT signOut user
  it('does NOT signOut user when admin delete fails (regression: bug #15)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-999' } } })
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: 'Service role key missing' },
    })

    const result = await deleteAccount('HAPUS AKUN')
    expect(result?.error).toMatch(/Service role key missing/)
    // CRITICAL: user must NOT be signed out
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  // BUG REGRESSION TEST: bug #15 — when admin client THROWS, do NOT signOut user
  it('does NOT signOut user when admin client throws (regression: bug #15)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-111' } } })
    mockAdminDeleteUser.mockImplementation(() => {
      throw new Error('admin client not configured')
    })

    const result = await deleteAccount('HAPUS AKUN')
    expect(result?.error).toBeDefined()
    // CRITICAL: user must NOT be signed out
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
