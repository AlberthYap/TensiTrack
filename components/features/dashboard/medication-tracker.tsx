'use client'

import { useState, useOptimistic, useRef, startTransition } from 'react'
import { Pill, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  addMedication,
  toggleMedication,
  deleteMedication,
  getTodayMedications,
  type MedicationEntry,
} from '@/app/actions/medications'

interface MedicationTrackerProps {
  medications: MedicationEntry[]
}

/** Temp IDs are prefixed so we can guard server calls until the real ID arrives. */
function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

export function MedicationTracker({ medications: initialMeds }: MedicationTrackerProps) {
  const [meds, setMeds] = useState(initialMeds)
  const [optimisticMeds, addOptimistic] = useOptimistic(
    meds,
    (state, update: { type: 'toggle'; id: string } | { type: 'add'; med: MedicationEntry } | { type: 'delete'; id: string }) => {
      if (update.type === 'toggle') {
        return state.map((m) => (m.id === update.id ? { ...m, taken: !m.taken } : m))
      }
      if (update.type === 'add') return [...state, update.med]
      if (update.type === 'delete') return state.filter((m) => m.id !== update.id)
      return state
    }
  )
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const takenCount = optimisticMeds.filter((m) => m.taken).length
  const totalCount = optimisticMeds.length
  const allDone = totalCount > 0 && takenCount === totalCount

  async function handleToggle(id: string) {
    // Guard: don't send temp IDs to the server
    if (isTempId(id)) return

    const med = meds.find((m) => m.id === id)
    if (!med) return
    startTransition(() => addOptimistic({ type: 'toggle', id }))
    const result = await toggleMedication(id, !med.taken)
    if (result?.error) {
      setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, taken: med.taken } : m)))
      setError(result.error)
    }
  }

  async function handleDelete(id: string) {
    // Guard: don't send temp IDs to the server
    if (isTempId(id)) return

    const prev = meds
    startTransition(() => addOptimistic({ type: 'delete', id }))
    setMeds((p) => p.filter((m) => m.id !== id))
    const result = await deleteMedication(id)
    if (result?.error) {
      setMeds(prev)
      setError(result.error)
    }
  }

  async function handleAdd(formData: FormData) {
    const name = formData.get('name') as string
    if (!name?.trim()) return

    const tempId = `temp-${Date.now()}`
    const tempMed: MedicationEntry = {
      id: tempId,
      user_id: '',
      name: name.trim(),
      dosage: (formData.get('dosage') as string) || null,
      taken: false,
      taken_date: new Date().toISOString().slice(0, 10),
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    startTransition(() => addOptimistic({ type: 'add', med: tempMed }))
    setMeds((p) => [...p, tempMed])

    const result = await addMedication(formData)
    if (result?.error) {
      setMeds((p) => p.filter((m) => m.id !== tempId))
      setError(result.error)
      return
    }

    // Replace temp entry with the real row from the database.
    const refreshed = await getTodayMedications()
    if (!refreshed.error) {
      setMeds(refreshed.data)
    }
    formRef.current?.reset()
    setShowForm(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
              <Pill className="w-4 h-4 text-white" />
            </span>
            <span>
              Obat Hari Ini
              {totalCount > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  {takenCount}/{totalCount}
                </span>
              )}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* All-done celebration */}
        {allDone && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 animate-fade-in-up">
            <Check className="w-4 h-4" />
            Semua obat sudah diminum hari ini!
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>
              Tutup
            </button>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form
            ref={formRef}
            action={handleAdd}
            className="space-y-2 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 animate-scale-in"
          >
            <div className="flex gap-2">
              <input
                name="name"
                placeholder="Nama obat..."
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                required
                autoFocus
              />
              <input
                name="dosage"
                placeholder="Dosis (opsional)"
                className="w-28 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700">
                Simpan
              </Button>
            </div>
          </form>
        )}

        {/* Medication list */}
        {optimisticMeds.length === 0 && !showForm ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
            Belum ada obat tercatat hari ini. Klik <Plus className="w-3 h-3 inline" /> untuk menambahkan.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {optimisticMeds.map((med) => (
              <li
                key={med.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all group',
                  med.taken
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                )}
              >
                {/* Toggle checkbox */}
                <button
                  onClick={() => handleToggle(med.id)}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                    med.taken
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-violet-400',
                    isTempId(med.id) && 'opacity-50 cursor-wait'  // visual hint during re-fetch
                  )}
                >
                  {med.taken && <Check className="w-3 h-3" />}
                </button>

                {/* Name + dosage */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      med.taken
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {med.name}
                  </p>
                  {med.dosage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{med.dosage}</p>
                  )}
                </div>

                {/* Delete (only on hover) */}
                <button
                  onClick={() => handleDelete(med.id)}
                  disabled={isTempId(med.id)}
                  className={cn(
                    'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded',
                    isTempId(med.id)
                      ? 'cursor-wait text-gray-300'
                      : 'hover:bg-red-100 dark:hover:bg-red-950 text-gray-400 hover:text-red-600'
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
