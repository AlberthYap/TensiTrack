'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

export function QuickAddButton() {
  return (
    <Link
      href="/records/new"
      className="fixed bottom-6 right-6 z-20 group"
      aria-label="Tambah data tekanan darah"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-blue-600 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
        <button
          type="button"
          className="relative h-14 w-14 md:h-auto md:w-auto md:px-6 md:py-3.5 rounded-full bg-blue-600 text-white font-semibold shadow-elevated hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5 group-active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 md:mr-2 transition-transform group-hover:rotate-90 duration-300" />
          <span className="hidden md:inline text-sm">Tambah Data</span>
        </button>
      </div>
    </Link>
  )
}
