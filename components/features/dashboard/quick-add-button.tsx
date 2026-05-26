'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickAddButton() {
  return (
    <Link href="/records/new" className="fixed bottom-6 right-6 z-20">
      <Button size="lg" className="rounded-full shadow-lg h-14 w-14 md:h-auto md:w-auto md:px-6">
        <Plus className="w-6 h-6 md:mr-2" />
        <span className="hidden md:inline">Tambah Data</span>
      </Button>
    </Link>
  )
}
