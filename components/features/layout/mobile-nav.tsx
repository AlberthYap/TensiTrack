'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { X, Heart, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { navigation, APP_BRAND } from './navigation'
import { NavLink } from './nav-link'
import { createPortal } from 'react-dom'

/**
 * Mobile navigation drawer.
 * - Renders hamburger button always on mobile
 * - Click hamburger to open drawer
 * - Click backdrop or any nav link to close
 * - Uses NavLink to prevent navigation spam
 * - Auto-closes when route changes
 * - Body scroll locked while open
 * - Renders via portal to escape any stacking-context / transform issues
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-close drawer when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while drawer is open (iOS-friendly)
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (open) {
      const previousOverflow = document.body.style.overflow
      const previousPosition = document.body.style.position
      const previousTop = document.body.style.top
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.overflow = previousOverflow
        document.body.style.position = previousPosition
        document.body.style.top = previousTop
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  const drawerContent = open ? (
    <div
      className="fixed inset-0"
      style={{ zIndex: 2147483647 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel - explicit height, no flex-col default issues */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          'absolute top-0 left-0 bottom-0 w-72 max-w-[85vw]',
          'bg-white dark:bg-gray-900 shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-slide-in-right'
        )}
        style={{ zIndex: 2147483647 }}
      >
        {/* Header - fixed at top */}
        <div className="flex-shrink-0 p-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <NavLink
            href="/dashboard"
            onNavigate={handleClose}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 flex-shrink-0">
              <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {APP_BRAND.name}
            </span>
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Tutup menu"
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav - scrollable middle */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto bg-white dark:bg-gray-900">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                href={item.href}
                onNavigate={handleClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white pointer-events-none'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
                activeClassName=""
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0',
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    )}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {item.name}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5 truncate',
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="rounded-xl p-3 bg-blue-50 dark:bg-blue-950/30">
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
              {APP_BRAND.name}
            </p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">
              {APP_BRAND.tagline} v1.0
            </p>
          </div>
        </div>
      </aside>
    </div>
  ) : null

  return (
    <>
      {/* Hamburger button - only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={handleOpen}
        aria-label="Buka menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Portal drawer to document.body to escape any stacking-context */}
      {mounted && typeof document !== 'undefined'
        ? createPortal(drawerContent, document.body)
        : null}
    </>
  )
}
