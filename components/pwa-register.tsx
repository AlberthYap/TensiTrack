'use client'

import { useEffect } from 'react'

/**
 * PwaRegister — registers /sw.js after the page is interactive.
 *
 * Design notes:
 *  - Register in production builds only (skip during `next dev` HMR).
 *  - Use `window.load` so registration doesn't compete with hydration /
 *    RSC payload for the main thread.
 *  - Unregister on dev to avoid stale caches.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const isDev = process.env.NODE_ENV !== 'production'

    if (isDev) {
      // Ensure no stale SW from a previous production deploy during dev.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
      return
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Log only — registration failure should not crash the app.
          console.warn('[PWA] Service worker registration failed:', err)
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return null
}
