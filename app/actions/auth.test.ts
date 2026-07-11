import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetUser = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockResetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}))

// Mock rate-limit helper supaya tests tidak bergantung pada Supabase admin
// client dan env vars. Default: allowed. Tests spesifik override per-case.
//
// vi.hoisted() WAJIB dipakai karena vi.mock() di-hoist ke paling atas file
// sebelum deklarasi const, sehingga const biasa tidak dapat diakses di
// factory. vi.hoisted memastikan mock instances siap sebelum vi.mock.
const rateLimitMocks = vi.hoisted(() => ({
  mockCheckAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, error: null }),
  mockGetClientIp: vi.fn().mockResolvedValue('127.0.0.1'),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkAuthRateLimit: rateLimitMocks.mockCheckAuthRateLimit,
  getClientIp: rateLimitMocks.mockGetClientIp,
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`__redirect__:${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => (name === 'host' ? 'localhost:3000' : null),
  }),
}))

import { login, register, forgotPassword } from '@/app/actions/auth'

const VALID_REGISTER_TOKEN = 'test-register-token-abc123'
process.env.REGISTER_ACCESS_TOKEN = VALID_REGISTER_TOKEN

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValue({ allowed: true, error: null })
  })

  it('returns error for invalid email format', async () => {
    const fd = new FormData()
    fd.set('email', 'not-an-email')
    fd.set('password', 'secret123')

    const result = await login(fd)
    expect(result?.error).toMatch(/Email tidak valid/)
  })

  it('returns error for empty password', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', '')

    const result = await login(fd)
    expect(result?.error).toBeDefined()
  })

  it('translates "Invalid login credentials" to Indonesian', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'wrong')

    const result = await login(fd)
    expect(result?.error).toMatch(/Email atau password salah/)
  })

  it('translates "Email not confirmed" to Indonesian', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Email not confirmed' },
    })
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret')

    const result = await login(fd)
    expect(result?.error).toMatch(/Email belum diverifikasi/)
  })

  it('returns original error message for other errors', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Network error' },
    })
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret')

    const result = await login(fd)
    expect(result?.error).toBe('Network error')
  })

  // SECURITY: rate-limit returns generic lockout, not user enumeration or
  // technical detail.
  it('returns generic lockout message when login rate limit exceeded', async () => {
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValueOnce({ allowed: false, error: null })
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'whatever')

    const result = await login(fd)
    expect(result?.error).toMatch(/Terlalu banyak/)
    // CRITICAL: tidak melanjutkan ke signInWithPassword pada rate-limit hit
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })
})

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValue({ allowed: true, error: null })
  })

  it('rejects when accessToken is missing', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret123')
    fd.set('full_name', 'John')

    // @ts-expect-error testing missing arg
    const result = await register(fd)
    expect(result?.error).toMatch(/Akses ditolak/)
  })

  it('rejects when accessToken is wrong', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret123')
    fd.set('full_name', 'John')

    const result = await register(fd, 'wrong-token')
    expect(result?.error).toMatch(/Akses ditolak/)
  })

  it('rejects when REGISTER_ACCESS_TOKEN env is unset', async () => {
    const saved = process.env.REGISTER_ACCESS_TOKEN
    delete process.env.REGISTER_ACCESS_TOKEN
    try {
      const fd = new FormData()
      fd.set('email', 'user@example.com')
      fd.set('password', 'secret123')
      fd.set('full_name', 'John')

      const result = await register(fd, 'any-token')
      expect(result?.error).toMatch(/Akses ditolak/)
    } finally {
      process.env.REGISTER_ACCESS_TOKEN = saved
    }
  })

  it('returns error for too-short name (when token valid)', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret123')
    fd.set('full_name', 'A')

    const result = await register(fd, VALID_REGISTER_TOKEN)
    expect(result?.error).toMatch(/Nama minimal 2/)
  })

  it('returns error for password < 8 chars (when token valid)', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', '12345')
    fd.set('full_name', 'John')

    const result = await register(fd, VALID_REGISTER_TOKEN)
    expect(result?.error).toMatch(/Password minimal 8/)
  })

  it('rejects common passwords (when token valid)', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'Password1')
    fd.set('full_name', 'John')

    const result = await register(fd, VALID_REGISTER_TOKEN)
    expect(result?.error).toMatch(/terlalu umum|unik/)
  })

  it('returns generic lockout message when register rate limit exceeded', async () => {
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValueOnce({ allowed: false, error: null })
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret123')
    fd.set('full_name', 'John')

    const result = await register(fd, VALID_REGISTER_TOKEN)
    expect(result?.error).toMatch(/Terlalu banyak/)
  })
})

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValue({ allowed: true, error: null })
  })

  it('returns generic success message when NEXT_PUBLIC_APP_URL unset', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    const fd = new FormData()
    fd.set('email', 'user@example.com')
    const result = await forgotPassword(fd)

    expect(result).toHaveProperty('success')
    // CRITICAL: tidak lanjut ke resetPasswordForEmail jika APP_URL missing
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('uses NEXT_PUBLIC_APP_URL for redirectTo (Host Header Injection fix)', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    const fd = new FormData()
    fd.set('email', 'user@example.com')
    await forgotPassword(fd)

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        redirectTo: 'https://app.example.com/reset-password',
      })
    )
    // CRITICAL: redirectTo TIDAK boleh mengandung localhost dari Host header
    const callArgs = mockResetPasswordForEmail.mock.calls[0][1]
    expect(callArgs.redirectTo).not.toContain('localhost')
  })

  it('returns generic lockout when forgotPassword rate limit exceeded (no enumeration)', async () => {
    rateLimitMocks.mockCheckAuthRateLimit.mockResolvedValueOnce({ allowed: false, error: null })

    const fd = new FormData()
    fd.set('email', 'user@example.com')
    const result = await forgotPassword(fd)

    // Response generik tidak membedakan rate-limited vs unregistered email.
    expect(result).toHaveProperty('success')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })
})
