'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function ReloadButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 min-w-[120px]"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
      Coba lagi
    </Button>
  )
}
