'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top progress bar yang muncul otomatis setiap kali route berubah.
 * Menggunakan animasi CSS sederhana (translateX 0→100% lalu fade out)
 * untuk mengindikasikan loading tanpa bergantung pada library NProgress.
 */
export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Reset dan mulai animasi loading saat route berubah
    setVisible(true)
    setProgress(0)

    // Simulasi progress increment (sampai 90%) selama route loading
    const timer1 = setTimeout(() => setProgress(30), 50)
    const timer2 = setTimeout(() => setProgress(60), 150)
    const timer3 = setTimeout(() => setProgress(80), 300)
    const timer4 = setTimeout(() => setProgress(95), 500)

    // Selesaikan dan hilangkan bar
    const finishTimer = setTimeout(() => {
      setProgress(100)
      const hideTimer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(hideTimer)
    }, 800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(finishTimer)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="h-full bg-blue-600 transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '400ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  )
}
