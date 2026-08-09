'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Indeterminate loading bar — appears instantly on every route change.
 * Uses Tailwind's built-in animate-pulse for a zero-CSS-hydration-risk bar.
 */
export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const minTimer = setTimeout(() => setVisible(false), 400)
    return () => clearTimeout(minTimer)
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden pointer-events-none"
      role="progressbar"
      aria-busy="true"
      aria-label="Loading..."
    >
      <div className="h-full w-1/3 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500 rounded-full animate-pulse" />
    </div>
  )
}
