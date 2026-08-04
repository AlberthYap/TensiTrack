'use client'

import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ProfileFormProps {
  initialData: {
    full_name: string
    email: string
    date_of_birth?: string | null
    target_systolic?: number | null
    target_diastolic?: number | null
  }
  disabled?: boolean
}

export function ProfileForm({ initialData, disabled }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    const result = await updateProfile(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={initialData.email}
          disabled
          readOnly
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Email tidak dapat diubah
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nama Lengkap</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={initialData.full_name}
          required={!disabled}
          autoComplete="name"
          minLength={2}
          maxLength={100}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
        <Input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          defaultValue={initialData.date_of_birth || ''}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Opsional. Dipakai untuk analisis kelompok umur.
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Target Tekanan Darah
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Tetapkan target tekanan darah Anda. Dashboard akan menampilkan progress mingguan terhadap target ini.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="target_systolic">Target Sistolik (mmHg)</Label>
            <Input
              id="target_systolic"
              name="target_systolic"
              type="number"
              min={50}
              max={250}
              defaultValue={initialData.target_systolic ?? ''}
              placeholder="120"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_diastolic">Target Diastolik (mmHg)</Label>
            <Input
              id="target_diastolic"
              name="target_diastolic"
              type="number"
              min={30}
              max={150}
              defaultValue={initialData.target_diastolic ?? ''}
              placeholder="80"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <SubmitButton disabled={disabled} />
    </form>
  )
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
    </Button>
  )
}
