'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Trash2, X } from 'lucide-react'

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAccount(confirmation, password)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Hapus Akun
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Hapus Akun Permanen
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false)
              setError(null)
              setConfirmation('')
              setPassword('')
            }}
            disabled={isPending}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 space-y-1">
          <p className="font-medium">Semua data akan dihapus:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li>Profil dan informasi akun</li>
            <li>Semua catatan tekanan darah</li>
            <li>Semua link share yang aktif</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Ketik <span className="font-mono font-bold">HAPUS AKUN</span> untuk
            konfirmasi
          </Label>
          <Input
            id="confirm"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={isPending}
            placeholder="HAPUS AKUN"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delete-password">
            Password saat ini
          </Label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Konfirmasi ulang password Anda sebagai langkah keamanan
            terakhir.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setError(null)
              setConfirmation('')
              setPassword('')
            }}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || confirmation !== 'HAPUS AKUN' || password.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Akun Saya
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
