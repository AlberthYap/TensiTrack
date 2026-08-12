'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { QuickAddModal } from './quick-add-modal'

export function QuickAddButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 right-6 z-20 group">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Tambah data tekanan darah"
          className="relative h-14 w-14 md:h-auto md:w-auto md:px-6 md:py-3.5 rounded-full bg-blue-600 text-white font-semibold shadow-elevated hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-active:scale-95 flex items-center justify-center"
        >
          <span className="absolute inset-0 bg-blue-600 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <span className="relative flex items-center">
            <Plus className="w-5 h-5 md:mr-2 transition-transform group-hover:rotate-90 duration-300" />
            <span className="hidden md:inline text-sm">Tambah Data</span>
          </span>
        </button>
      </div>

      <QuickAddModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
