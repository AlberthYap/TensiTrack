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
const AUTO_SUBMIT_TEXT = /Mengirim catatan tersimpan/i

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

describe('BloodPressureForm — localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('saves form data to localStorage when offline and form is dirty', () => {
    const getStub = vi.spyOn(Storage.prototype, 'setItem')
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    })

    render(<BloodPressureForm />)

    // Fill in form values to make it dirty
    const systolicInput = screen.getByLabelText(/Systolic/i)
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(systolicInput, '130')
      systolicInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(getStub).toHaveBeenCalledWith(
      'tensi-offline-form',
      expect.stringContaining('"systolic":"130"')
    )
  })

  it('does NOT save to localStorage when online', () => {
    const getStub = vi.spyOn(Storage.prototype, 'setItem')

    render(<BloodPressureForm />)

    const systolicInput = screen.getByLabelText(/Systolic/i)
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(systolicInput, '130')
      systolicInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // setItem might be called for other reasons, but NOT for the offline form key
    const offlineCalls = getStub.mock.calls.filter(
      (call) => call[0] === 'tensi-offline-form'
    )
    expect(offlineCalls).toHaveLength(0)
  })

  it('restores saved form data from localStorage on mount', () => {
    localStorage.setItem(
      'tensi-offline-form',
      JSON.stringify({
        systolic: '145',
        diastolic: '95',
        pulse: '88',
        measured_at: '2025-01-15T08:00',
        notes: 'Test note',
      })
    )

    render(<BloodPressureForm />)

    const systolicInput = screen.getByLabelText(/Systolic/i) as HTMLInputElement
    const diastolicInput = screen.getByLabelText(/Diastolic/i) as HTMLInputElement
    const notesInput = screen.getByPlaceholderText(/Tambahkan catatan/) as HTMLTextAreaElement

    expect(systolicInput.value).toBe('145')
    expect(diastolicInput.value).toBe('95')
    expect(notesInput.value).toBe('Test note')
  })

  it('does NOT restore saved form data in edit mode', () => {
    localStorage.setItem(
      'tensi-offline-form',
      JSON.stringify({
        systolic: '145',
        diastolic: '95',
        pulse: '88',
        measured_at: '2025-01-15T08:00',
        notes: 'Offline data',
      })
    )

    render(
      <BloodPressureForm
        record={{
          id: 'rec-123',
          user_id: 'user-1',
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          category: 'normal',
          notes: 'Edit data',
          measured_at: '2025-01-15T08:00:00.000Z',
          created_at: '2025-01-15T08:00:00.000Z',
          updated_at: '2025-01-15T08:00:00.000Z',
          deleted_at: null,
        }}
      />
    )

    const systolicInput = screen.getByLabelText(/Systolic/i) as HTMLInputElement
    expect(systolicInput.value).toBe('120')
  })

  it('sets offlineQueuedRef and auto-submits on reconnect', async () => {
    // Import the mocked module to assert calls
    const { addBloodPressureRecord } = await import('@/app/actions/blood-pressure')

    localStorage.setItem(
      'tensi-offline-form',
      JSON.stringify({
        systolic: '130',
        diastolic: '85',
        pulse: '',
        measured_at: '2025-01-15T08:00',
        notes: '',
      })
    )

    // Mount while offline so offlineQueuedRef gets set
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get: () => false,
    })
    render(<BloodPressureForm />)

    // Now simulate coming back online
    await act(async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => true,
      })
      window.dispatchEvent(new Event('online'))
    })

    // Should show the auto-submitting toast
    expect(screen.getByText(AUTO_SUBMIT_TEXT)).toBeInTheDocument()
    // The auto-submit should have called addBloodPressureRecord
    expect(addBloodPressureRecord).toHaveBeenCalled()
  })

  it('clears localStorage after discard confirmation', () => {
    localStorage.setItem(
      'tensi-offline-form',
      JSON.stringify({
        systolic: '130',
        diastolic: '85',
        pulse: '',
        measured_at: '2025-01-15T08:00',
        notes: '',
      })
    )
    const removeStub = vi.spyOn(Storage.prototype, 'removeItem')

    render(<BloodPressureForm />)

    // The form was restored from localStorage so it starts dirty.
    // Clicking Batal should show the discard confirmation dialog.
    const cancelBtn = screen.getByText('Batal')
    act(() => {
      cancelBtn.click()
    })

    // Confirm discard — should clear localStorage
    const discardBtn = screen.getByText('Buang Perubahan')
    act(() => {
      discardBtn.click()
    })

    expect(removeStub).toHaveBeenCalledWith('tensi-offline-form')
  })

  it('persists form data on offline event transition', () => {
    const setStub = vi.spyOn(Storage.prototype, 'setItem')

    render(<BloodPressureForm />)

    // Fill in form values first (while online)
    const systolicInput = screen.getByLabelText(/Systolic/i)
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(systolicInput, '140')
      systolicInput.dispatchEvent(new Event('input', { bubbles: true }))
    })

    // Now go offline
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => false,
      })
      window.dispatchEvent(new Event('offline'))
    })

    const offlineCalls = setStub.mock.calls.filter(
      (call) => call[0] === 'tensi-offline-form'
    )
    expect(offlineCalls.length).toBeGreaterThanOrEqual(1)
    expect(offlineCalls[offlineCalls.length - 1][1]).toContain('"systolic":"140"')
  })
})
