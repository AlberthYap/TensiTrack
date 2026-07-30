'use client'

import { useFormStatus } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addBloodPressureRecord, updateBloodPressureRecord } from '@/app/actions/blood-pressure'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  WifiOff,
  X,
} from 'lucide-react'
import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { calculateCategory } from '@/lib/blood-pressure'
import { CategoryBadge } from '@/components/ui/category-badge'

const OFFLINE_FORM_KEY = 'tensi-offline-form'

/**
 * `navigator.onLine` only reflects adapter-level connectivity, not actual
 * internet reachability. Useful as a UX gate (disable submit) before the
 * request would really fail.
 */
function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

interface BloodPressureFormProps {
  record?: BloodPressureRecord
  redirectPath?: string
}

interface FormState {
  systolic: string
  diastolic: string
  pulse: string
  measured_at: string
  notes: string
}

export function BloodPressureForm({ record, redirectPath = '/records' }: BloodPressureFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDiscard, setShowDiscard] = useState(false)
  const isOnline = useOnlineStatus()
  const isEdit = !!record

  // Surface the toast on reconnect: the user may have abandoned an
  // entry mid-fill while offline; the toast nudges them to re-submit.
  // If offline form data was queued, we auto-submit it immediately.
  const prevIsOnlineRef = useRef<boolean>(true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false)
  const offlineQueuedRef = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drop the toast on online→offline: the "reconnected" message would
  // lie once the device disconnects again, so it must not linger.
  const hideReconnected = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    setShowReconnected(false)
    setIsAutoSubmitting(false)
    setAutoSubmitFailed(false)
  }

  useEffect(() => {
    const wasOffline = prevIsOnlineRef.current === false
    const isNowOnline = isOnline === true

    if (wasOffline && isNowOnline) {
      // Auto-submit queued offline form data if present.
      if (!isEdit && offlineQueuedRef.current && isDirty()) {
        setIsAutoSubmitting(true)
        setAutoSubmitFailed(false)
        setShowReconnected(true)
        submitOfflineForm()
      } else {
        setShowReconnected(true)
        reconnectTimerRef.current = setTimeout(hideReconnected, 4000)
      }
    } else if (!wasOffline && !isNowOnline) {
      hideReconnected()
      setAutoSubmitFailed(false)
    }

    prevIsOnlineRef.current = isOnline
  }, [isOnline])

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [])

  // Shift UTC ISO string so datetime-local shows local time, since
  // <input type="datetime-local"> interprets values in local TZ.
  const getLocalDatetimeString = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date()
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  }

  const buildInitialValues = (): FormState => ({
    systolic: record?.systolic?.toString() || '',
    diastolic: record?.diastolic?.toString() || '',
    pulse: record?.pulse?.toString() || '',
    measured_at: getLocalDatetimeString(record?.measured_at),
    notes: record?.notes || '',
  })

  const initialValues = useRef<FormState>(buildInitialValues())

  // Restore saved form data from localStorage (new record only).
  // This preserves user input when the browser tab was closed while offline.
  const [formValues, setFormValues] = useState<FormState>(() => {
    if (isEdit) return buildInitialValues()
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(OFFLINE_FORM_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as FormState
          // Basic sanity check — if offline-form saved data looks like
          // something the user intended, restore it.
          if (parsed.systolic || parsed.diastolic || parsed.measured_at) {
            return parsed
          }
        }
      }
    } catch {
      // localStorage may throw in some environments (private browsing, quota).
    }
    return buildInitialValues()
  })

  const isDirty = () => {
    return (
      formValues.systolic !== initialValues.current.systolic ||
      formValues.diastolic !== initialValues.current.diastolic ||
      formValues.pulse !== initialValues.current.pulse ||
      formValues.measured_at !== initialValues.current.measured_at ||
      formValues.notes !== initialValues.current.notes
    )
  }

  // Persist form values to localStorage when offline so the user's
  // partial entry survives browser tab close / crash.
  const saveOfflineForm = () => {
    if (isEdit) return
    if (isOnline) return
    if (!isDirty()) return
    try {
      localStorage.setItem(OFFLINE_FORM_KEY, JSON.stringify(formValues))
      offlineQueuedRef.current = true
    } catch {
      // Quota exceeded or private browsing — silently skip.
    }
  }

  useEffect(() => {
    saveOfflineForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, isOnline, isEdit])

  // Also save when transitioning to offline state, in case the user
  // filled the form while online but then loses connectivity.
  useEffect(() => {
    if (isEdit) return
    const handleOffline = () => {
      if (isDirty()) {
        try {
          localStorage.setItem(OFFLINE_FORM_KEY, JSON.stringify(formValues))
          offlineQueuedRef.current = true
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, formValues])

  // Clear saved offline form data on successful submit.
  const clearOfflineForm = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(OFFLINE_FORM_KEY)
      }
    } catch { /* ignore */ }
    offlineQueuedRef.current = false
  }

  /**
   * Auto-submit queued offline form data when connectivity returns.
   * Builds FormData from the current (or restored) formValues and
   * calls the same server action the manual submit uses.
   */
  const submitOfflineForm = async () => {
    try {
      const fd = new FormData()
      fd.append('systolic', formValues.systolic)
      fd.append('diastolic', formValues.diastolic)
      if (formValues.pulse) fd.append('pulse', formValues.pulse)
      fd.append('notes', formValues.notes)

      const measuredAtStr = formValues.measured_at
      if (measuredAtStr) {
        const localDate = new Date(measuredAtStr)
        fd.set('measured_at', localDate.toISOString())
      } else {
        fd.set('measured_at', new Date().toISOString())
      }

      const result = await addBloodPressureRecord(fd)

      if (result?.error) {
        setAutoSubmitFailed(true)
        setIsAutoSubmitting(false)
        reconnectTimerRef.current = setTimeout(hideReconnected, 6000)
      }
      // On success: addBloodPressureRecord calls redirect('/dashboard'),
      // so the component unmounts — no need to update local state.
    } catch {
      setAutoSubmitFailed(true)
      setIsAutoSubmitting(false)
      reconnectTimerRef.current = setTimeout(hideReconnected, 6000)
    }
  }

  const previewCategory = (() => {
    const sys = parseInt(formValues.systolic)
    const dia = parseInt(formValues.diastolic)
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null
    if (sys < 50 || sys > 250 || dia < 30 || dia > 150) return null
    return calculateCategory(sys, dia)
  })()

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Server stores timestamps in UTC; the input gave us local time
    // (datetime-local = browser TZ), so normalize before submit.
    const measuredAtStr = formData.get('measured_at') as string
    if (measuredAtStr) {
      const localDate = new Date(measuredAtStr)
      formData.set('measured_at', localDate.toISOString())
    }

    const result = isEdit
      ? await updateBloodPressureRecord(record.id, formData)
      : await addBloodPressureRecord(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      clearOfflineForm()
    }
  }

  const handleCancelClick = () => {
    if (isDirty()) {
      setShowDiscard(true)
    } else {
      router.push(redirectPath)
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscard(false)
    clearOfflineForm()
    router.push(redirectPath)
  }

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <form ref={formRef} action={handleSubmit} className="space-y-6">
        {/* Auto-submit toast — shown when offline-queued form data
            is being (or failed to be) submitted automatically. */}
        {(isAutoSubmitting || autoSubmitFailed) && (
          <div
            role="status"
            aria-live="polite"
            className={`border rounded-lg p-3 flex items-start gap-2 animate-fade-in-up ${
              autoSubmitFailed
                ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
            }`}
          >
            {isAutoSubmitting ? (
              <Loader2
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                autoSubmitFailed
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                {isAutoSubmitting
                  ? 'Mengirim catatan tersimpan...'
                  : 'Gagal mengirim otomatis'}
              </p>
              <p className={`text-sm mt-0.5 ${
                autoSubmitFailed
                  ? 'text-red-600/80 dark:text-red-400/80'
                  : 'text-blue-600/80 dark:text-blue-400/80'
              }`}>
                {isAutoSubmitting
                  ? 'Mengirim data yang disimpan saat offline...'
                  : 'Silakan klik Simpan untuk mencoba lagi.'}
              </p>
            </div>
          </div>
        )}

        {/* Restoration toast — shown on simple reconnect (no queued data). */}
        {showReconnected && !isAutoSubmitting && !autoSubmitFailed && (
          <div
            role="status"
            aria-live="polite"
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2 animate-fade-in-up"
          >
            <CheckCircle2
              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Koneksi pulih, silakan simpan catatan
              </p>
            </div>
          </div>
        )}

        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2 animate-fade-in-up"
          >
            <WifiOff
              className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Tidak ada koneksi internet
              </p>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Penyimpanan catatan memerlukan koneksi. Silakan tunggu sampai
                online kembali untuk menyimpan.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Gagal menyimpan
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="systolic">
              Systolic (mmHg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="systolic"
              name="systolic"
              type="number"
              placeholder="120"
              required
              min="50"
              max="250"
              value={formValues.systolic}
              onChange={(e) => handleFormChange('systolic', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tekanan darah atas (50-250 mmHg)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diastolic">
              Diastolic (mmHg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="diastolic"
              name="diastolic"
              type="number"
              placeholder="80"
              required
              min="30"
              max="150"
              value={formValues.diastolic}
              onChange={(e) => handleFormChange('diastolic', e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tekanan darah bawah (30-150 mmHg)
            </p>
          </div>
        </div>

        {previewCategory && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Kategori:</span>
            <CategoryBadge category={previewCategory} size="sm" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pulse">Denyut Nadi (bpm)</Label>
          <Input
            id="pulse"
            name="pulse"
            type="number"
            placeholder="72"
            min="30"
            max="200"
            value={formValues.pulse}
            onChange={(e) => handleFormChange('pulse', e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Opsional (30-200 bpm)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="measured_at">
            Waktu Pengukuran <span className="text-red-500">*</span>
          </Label>
          <Input
            id="measured_at"
            name="measured_at"
            type="datetime-local"
            required
            value={formValues.measured_at}
            onChange={(e) => handleFormChange('measured_at', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Tambahkan catatan (opsional)..."
            rows={3}
            maxLength={500}
            value={formValues.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Maksimal 500 karakter
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formValues.notes.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <SubmitButton
            isEdit={isEdit}
            isDirty={isDirty()}
            isOffline={!isOnline || isAutoSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelClick}
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
        </div>
      </form>

      {showDiscard && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowDiscard(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Buang perubahan?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Anda memiliki perubahan yang belum disimpan. Jika keluar sekarang,
                    semua perubahan akan hilang.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDiscard(false)}
                >
                  Lanjut Mengisi
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Buang Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SubmitButton({
  isEdit,
  isDirty,
  isOffline,
}: {
  isEdit: boolean
  isDirty: boolean
  isOffline: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || !isDirty || isOffline}
      title={
        isOffline
          ? 'Tidak dapat menyimpan saat offline'
          : !isDirty
            ? 'Form belum diubah'
            : undefined
      }
      className="bg-blue-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          {isEdit ? 'Update' : 'Simpan'}
        </>
      )}
    </Button>
  )
}
