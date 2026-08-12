'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { quickAddBloodPressureRecord } from '@/app/actions/blood-pressure'
import { VoiceInput } from '@/components/ui/voice-input'
import { TagSelector } from '@/components/features/records/tag-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import { calculateCategory } from '@/lib/blood-pressure'
import { CategoryBadge } from '@/components/ui/category-badge'

interface QuickAddModalProps {
  open: boolean
  onClose: () => void
}

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const router = useRouter()
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Reset state each time the modal opens.
  useEffect(() => {
    if (open) {
      setSystolic('')
      setDiastolic('')
      setPulse('')
      setNotes('')
      setSelectedTags([])
      setError(null)
      setSuccess(false)
    }
  }, [open])

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const previewCategory = (() => {
    const sys = parseInt(systolic)
    const dia = parseInt(diastolic)
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null
    if (sys < 50 || sys > 250 || dia < 30 || dia > 150) return null
    return calculateCategory(sys, dia)
  })()

  const handleVoiceResult = (sys: string, dia: string, pls: string | null) => {
    setSystolic(sys)
    setDiastolic(dia)
    if (pls) setPulse(pls)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)

    const fd = new FormData()
    fd.set('systolic', systolic)
    fd.set('diastolic', diastolic)
    if (pulse) fd.set('pulse', pulse)
    if (notes) fd.set('notes', notes)
    fd.set('tags', selectedTags.join(','))
    // measured_at defaults to "now" on the server side (schema requires it,
    // so send current local time normalized to UTC like the main form does).
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    fd.set('measured_at', now.toISOString())

    const result = await quickAddBloodPressureRecord(fd)

    setSubmitting(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      router.refresh()
      // Briefly show success, then close.
      setTimeout(() => {
        onClose()
      }, 900)
    }
  }

  const canSubmit =
    systolic && diastolic && !submitting

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tambah data tekanan darah"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 animate-scale-in max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Catat Cepat
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Simpan pengukuran sekarang, detail nanti
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Voice input — full width */}
          <VoiceInput onResult={handleVoiceResult} />

          {/* Systolic / Diastolic */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qa-systolic" className="text-xs">
                Systolic <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qa-systolic"
                type="number"
                inputMode="numeric"
                placeholder="120"
                min={50}
                max={250}
                required
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="h-11 text-lg tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa-diastolic" className="text-xs">
                Diastolic <span className="text-red-500">*</span>
              </Label>
              <Input
                id="qa-diastolic"
                type="number"
                inputMode="numeric"
                placeholder="80"
                min={30}
                max={150}
                required
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="h-11 text-lg tabular-nums"
              />
            </div>
          </div>

          {/* Pulse */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-pulse" className="text-xs">
              Denyut Nadi (opsional)
            </Label>
            <Input
              id="qa-pulse"
              type="number"
              inputMode="numeric"
              placeholder="72"
              min={30}
              max={200}
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="h-11 tabular-nums"
            />
          </div>

          {/* Notes — compact single-line-ish input */}
          <div className="space-y-1.5">
            <Label htmlFor="qa-notes" className="text-xs">
              Catatan (opsional)
            </Label>
            <Textarea
              id="qa-notes"
              placeholder="Tambahkan catatan singkat..."
              rows={1}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm resize-none min-h-0 py-2"
            />
          </div>

          {/* Live category preview */}
          {previewCategory && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
              <span className="text-xs text-gray-600 dark:text-gray-400">Kategori:</span>
              <CategoryBadge category={previewCategory} size="sm" />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs">Faktor Gaya Hidup</Label>
            <TagSelector selected={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Tersimpan! Data baru muncul di dashboard.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-11">
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
