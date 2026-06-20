import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock supabase server client
const mockGetUser = vi.fn()
const mockSignInWithPassword = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
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

vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => (name === 'host' ? 'localhost:3000' : null),
  }),
}))

import { login, register } from '@/app/actions/auth'

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for too-short name', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'secret123')
    fd.set('full_name', 'A')

    const result = await register(fd)
    expect(result?.error).toMatch(/Nama minimal 2/)
  })

  it('returns error for password < 6 chars', async () => {
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', '12345')
    fd.set('full_name', 'John')

    const result = await register(fd)
    expect(result?.error).toMatch(/Password minimal 6/)
  })
})
