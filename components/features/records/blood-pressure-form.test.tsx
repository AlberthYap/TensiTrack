import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { BloodPressureForm } from './blood-pressure-form'

// useFormStatus ditambahkan stabil di React 19 / Canary 18.3. Jika
// react-dom versi lama tidak expose, mock dengan pending statis cukup
// untuk test transisi (test ini tidak pernah submit form).
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>()
  return {
    ...actual,
    useFormStatus: vi.fn(() => ({
      pending: false,
      data: null,
      action: undefined,
      method: undefined,
    })),
  }
})

vi.mock('@/app/actions/blood-pressure', () => ({
  addBloodPressureRecord: vi.fn().mockResolvedValue({ error: null }),
  updateBloodPressureRecord: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const TOAST_TEXT = /Koneksi pulih, silakan simpan catatan/i
const OFFLINE_BANNER_TEXT = /Tidak ada koneksi internet/i

describe('BloodPressureForm — connection status transitions', () => {
  let onLineValue = true

  beforeEach(() => {
    onLineValue = true
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => onLineValue,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('does not show restoration toast when mounting while already offline', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument()
  })

  it('shows restoration toast on offline → online transition', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument()

    act(() => {
      onLineValue = true
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText(TOAST_TEXT)).toBeInTheDocument()
  })

  it('auto-dismisses restoration toast after 4000ms', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    act(() => {
      onLineValue = true
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText(TOAST_TEXT)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
  })

  it('keeps restoration toast visible just before the 4s threshold', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    act(() => {
      onLineValue = true
      window.dispatchEvent(new Event('online'))
    })

    act(() => {
      vi.advanceTimersByTime(3999)
    })

    expect(screen.getByText(TOAST_TEXT)).toBeInTheDocument()
  })

  it('dismisses restoration toast immediately when connection drops before 4s', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    act(() => {
      onLineValue = true
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.getByText(TOAST_TEXT)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    act(() => {
      onLineValue = false
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument()

    // Timer lama harus sudah di-clear, tidak refire.
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
  })

  it('does not show restoration toast when online at mount and stays online', () => {
    onLineValue = true
    render(<BloodPressureForm />)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()

    // Guard: tidak ada timer bocor dari event 'online' tanpa transisi.
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
  })

  it('is idempotent on repeated offline events without true transition', () => {
    onLineValue = false
    render(<BloodPressureForm />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.queryByText(TOAST_TEXT)).not.toBeInTheDocument()
    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument()
  })
})
