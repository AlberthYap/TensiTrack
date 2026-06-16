'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { deleteBloodPressureRecord } from '@/app/actions/blood-pressure'

interface DeleteRecordDialogProps {
  recordId: string
  recordLabel?: string
  redirectAfterDelete?: boolean
  trigger?: React.ReactNode
}

export function DeleteRecordDialog({
  recordId,
  recordLabel,
  redirectAfterDelete = false,
  trigger,
}: DeleteRecordDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteBloodPressureRecord(recordId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      if (redirectAfterDelete) {
        router.push('/records')
        router.refresh()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-700">
          <Trash2 className="w-4 h-4 mr-2" />
          Hapus
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => !isPending && setOpen(false)}
        >
          <Card
            className="w-full max-w-md animate-scale-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/30 flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Hapus Pencatatan?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tindakan ini tidak dapat dibatalkan. Data pencatatan
                    {recordLabel && (
                      <>
                        {' '}
                        <strong className="text-gray-700 dark:text-gray-300">
                          {recordLabel}
                        </strong>
                      </>
                    )}{' '}
                    akan dihapus permanen.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
