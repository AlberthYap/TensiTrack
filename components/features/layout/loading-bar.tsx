'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Indeterminate loading bar that appears INSTANTLY on every route change.
 *
 * Shows a CSS-animated gradient bar immediately (0ms delay) to give users
 * instant visual feedback when navigating. Combined with loading.tsx page
 * skeletons, this eliminates the "no feedback" gap that causes spam-clicking.
 *
 * Minimum visible time: 400ms (prevents distracting flicker on fast loads).
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
    <>
      <style>{`
        @keyframes loading-indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
        .loading-bar-inner {
          animation: loading-indeterminate 1.2s ease-in-out infinite;
        }
      `}</style>
      <div
        className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden pointer-events-none"
        role="progressbar"
        aria-busy="true"
        aria-label="Loading..."
      >
        <div className="loading-bar-inner h-full w-1/3 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500 rounded-full" />
      </div>
    </>
  )
}
