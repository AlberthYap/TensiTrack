import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock supabase server client
const mockGetUser = vi.fn()
const mockSignOut = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockUpdateUser = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

const rateLimitMocks = vi.hoisted(() => ({
  checkAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, error: null }),
}))

vi.mock('@/lib/rate-limit', () => rateLimitMocks)

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
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

import { deleteAccount, changePassword, updateProfile } from '@/app/actions/profile'

const VALID_PASSWORD = 'ValidPassword123'

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: re-auth password succeeds
    mockSignInWithPassword.mockResolvedValue({ error: null })
  })

  it('returns Unauthorized when user not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await deleteAccount('HAPUS AKUN', VALID_PASSWORD)
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns error when confirmation text is wrong', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })
    const result = await deleteAccount('salah', VALID_PASSWORD)
    expect(result?.error).toMatch(/Konfirmasi tidak valid/)
  })

  // SECURITY: required re-auth prevents session-hijack account deletion.
  it('returns error when password is empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })
    const result = await deleteAccount('HAPUS AKUN', '')
    expect(result?.error).toMatch(/Password saat ini wajib/)
    // CRITICAL: tidak lanjut signInWithPassword
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  // SECURITY: critical regression — wrong password must NOT delete account.
  it('returns error when re-auth password fails (does NOT delete)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-attacker', email: 'user@example.com' } },
    })
    // Attack scenario: attacker has session hijack but does NOT know password.
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })

    const result = await deleteAccount('HAPUS AKUN', 'wrong-password')
    expect(result?.error).toMatch(/Password salah/)
    // CRITICAL: admin delete HARUS NOT called when re-auth fails
    expect(mockAdminDeleteUser).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('signs in with current password and deletes via admin client', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-789', email: 'user@example.com' } },
    })
    mockAdminDeleteUser.mockResolvedValue({ error: null })
    mockSignOut.mockResolvedValue({})

    try {
      await deleteAccount('HAPUS AKUN', VALID_PASSWORD)
    } catch (e) {
      // expected redirect to /?deleted=1
      if (e instanceof Error && e.message.startsWith('__redirect__:/?deleted=1')) {
        // ok
      } else {
        throw e
      }
    }

    // Re-auth happened with correct credentials
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: VALID_PASSWORD,
    })
    expect(mockAdminDeleteUser).toHaveBeenCalledWith('user-789')
  })

  // BUG REGRESSION TEST: bug #15 — when admin delete FAILS, do NOT signOut user
  it('does NOT signOut user when admin delete fails (regression: bug #15)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-999', email: 'user@example.com' } },
    })
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: 'Service role key missing' },
    })

    const result = await deleteAccount('HAPUS AKUN', VALID_PASSWORD)
    expect(result?.error).toMatch(/Akun tidak dapat dihapus dari sisi server/)
    // CRITICAL: user must NOT be signed out
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  // BUG REGRESSION TEST: bug #15 — when admin client THROWS, do NOT signOut user
  it('does NOT signOut user when admin client throws (regression: bug #15)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-111', email: 'user@example.com' } },
    })
    mockAdminDeleteUser.mockImplementation(() => {
      throw new Error('admin client not configured')
    })

    const result = await deleteAccount('HAPUS AKUN', VALID_PASSWORD)
    expect(result?.error).toBeDefined()
    // CRITICAL: user must NOT be signed out
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  // DEMO: shared demo account must not be deleted.
  it('prevents deletion of the demo account', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const result = await deleteAccount('HAPUS AKUN', VALID_PASSWORD)
    expect(result?.error).toMatch(/Akun demo tidak dapat dihapus/)
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
    expect(mockAdminDeleteUser).not.toHaveBeenCalled()
  })
})

describe('changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitMocks.checkAuthRateLimit.mockResolvedValue({ allowed: true, error: null })
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })
  })

  it('uses the shared strong-password policy and rate limits changes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })

    const fd = new FormData()
    fd.set('currentPassword', 'old-password')
    fd.set('newPassword', VALID_PASSWORD)
    fd.set('confirmPassword', VALID_PASSWORD)

    const result = await changePassword(fd)

    expect(result).toEqual({ success: 'Password berhasil diubah' })
    expect(rateLimitMocks.checkAuthRateLimit).toHaveBeenCalledWith(
      'password-change:user:user-1',
      5,
      15 * 60
    )
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: VALID_PASSWORD })
  })

  it('rejects a common new password before attempting re-authentication', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })

    const fd = new FormData()
    fd.set('currentPassword', 'old-password')
    fd.set('newPassword', '12345678')
    fd.set('confirmPassword', '12345678')

    const result = await changePassword(fd)

    expect(result?.error).toMatch(/terlalu umum|unik/)
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('stops password changes after the per-user rate limit is exceeded', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    })
    rateLimitMocks.checkAuthRateLimit.mockResolvedValueOnce({ allowed: false, error: null })

    const fd = new FormData()
    fd.set('currentPassword', 'old-password')
    fd.set('newPassword', VALID_PASSWORD)
    fd.set('confirmPassword', VALID_PASSWORD)

    const result = await changePassword(fd)

    expect(result?.error).toMatch(/Terlalu banyak/)
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  // DEMO: shared demo account password must remain fixed.
  it('prevents changing password for the demo account', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const fd = new FormData()
    fd.set('currentPassword', 'old-password')
    fd.set('newPassword', 'NewPassword123')
    fd.set('confirmPassword', 'NewPassword123')

    const result = await changePassword(fd)
    expect(result?.error).toMatch(/Akun demo tidak dapat mengubah password/)
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })
})

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // DEMO: shared demo account profile must remain fixed.
  it('prevents updating profile for the demo account', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'demo-1', email: 'guest@tensitrack.com' } },
    })

    const fd = new FormData()
    fd.set('full_name', 'Hacker')
    fd.set('date_of_birth', '2000-01-01')

    const result = await updateProfile(fd)
    expect(result?.error).toMatch(/Akun demo tidak dapat mengubah profil/)
  })
})
