'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { addBloodPressureRecord, updateBloodPressureRecord } from '@/app/actions/blood-pressure'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { BloodPressureRecord } from '@/types/blood-pressure.types'

interface BloodPressureFormProps {
  record?: BloodPressureRecord
}

export function BloodPressureForm({ record }: BloodPressureFormProps) {
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!record

  // Default to current date and time
  const now = new Date()
  const defaultDateTime = now.toISOString().slice(0, 16)

  async function handleSubmit(formData: FormData) {
    setError(null)
    
    const result = isEdit
      ? await updateBloodPressureRecord(record.id, formData)
      : await addBloodPressureRecord(formData)
    
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
            defaultValue={record?.systolic}
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
            defaultValue={record?.diastolic}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tekanan darah bawah (30-150 mmHg)
          </p>
        </div>
      </div>

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
          defaultValue={record?.pulse || ''}
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
          defaultValue={record?.measured_at.slice(0, 16) || defaultDateTime}
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
          defaultValue={record?.notes || ''}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maksimal 500 karakter
        </p>
      </div>

      <div className="flex gap-3">
        <SubmitButton isEdit={isEdit} />
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
      </div>
    </form>
  )
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
    </Button>
  )
}
