'use client'

import { useFormStatus } from 'react-dom'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addBloodPressureRecord, updateBloodPressureRecord } from '@/app/actions/blood-pressure'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Save, X } from 'lucide-react'
import { BloodPressureRecord } from '@/types/blood-pressure.types'
import { calculateCategory, getCategoryInfo } from '@/lib/blood-pressure'
import { CategoryBadge } from '@/components/ui/category-badge'

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

const INITIAL_STATE: FormState = {
  systolic: '',
  diastolic: '',
  pulse: '',
  measured_at: '',
  notes: '',
}

export function BloodPressureForm({ record, redirectPath = '/records' }: BloodPressureFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDiscard, setShowDiscard] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const isEdit = !!record

  // Convert UTC string to local datetime string for the input
  const getLocalDatetimeString = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date()
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  }

  // Build initial form values once (lazy init) so we can use them
  // for both the form state and dirty-detection baseline
  const buildInitialValues = (): FormState => ({
    systolic: record?.systolic?.toString() || '',
    diastolic: record?.diastolic?.toString() || '',
    pulse: record?.pulse?.toString() || '',
    measured_at: getLocalDatetimeString(record?.measured_at),
    notes: record?.notes || '',
  })

  // Track initial form values for dirty detection (snapshot at mount)
  const initialValues = useRef<FormState>(buildInitialValues())

  // Track form changes for discard confirmation
  const [formValues, setFormValues] = useState<FormState>(buildInitialValues())

  // Check if form is dirty (has changes)
  const isDirty = () => {
    return (
      formValues.systolic !== initialValues.current.systolic ||
      formValues.diastolic !== initialValues.current.diastolic ||
      formValues.pulse !== initialValues.current.pulse ||
      formValues.measured_at !== initialValues.current.measured_at ||
      formValues.notes !== initialValues.current.notes
    )
  }

  // Live preview of category
  const previewCategory = (() => {
    const sys = parseInt(formValues.systolic)
    const dia = parseInt(formValues.diastolic)
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null
    if (sys < 50 || sys > 250 || dia < 30 || dia > 150) return null
    return calculateCategory(sys, dia)
  })()

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Convert local datetime to UTC ISO string before sending to server
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
    router.push(redirectPath)
  }

  const handleFormChange = (field: keyof FormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <form ref={formRef} action={handleSubmit} className="space-y-6">
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
          {/* Systolic */}
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

          {/* Diastolic */}
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

        {/* Live Preview */}
        {previewCategory && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Kategori:</span>
            <CategoryBadge category={previewCategory} size="sm" />
          </div>
        )}

        {/* Pulse */}
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

        {/* Measured At */}
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

        {/* Notes */}
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
          <SubmitButton isEdit={isEdit} isDirty={isDirty()} />
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

      {/* Discard Confirmation Dialog */}
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

function SubmitButton({ isEdit, isDirty }: { isEdit: boolean; isDirty: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || !isDirty}
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
