'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: ReactNode
  className?: string
  activeClassName?: string
  onNavigate?: () => void
}

/**
 * NavLink dengan anti-spam guard: mencegah user mengklik link
 * yang sama berkali-kali dalam 600ms (debounce sederhana).
 *
 * Catatan: saat pathname sudah sama dengan href, klik di-block
 * supaya router.push() tidak dipanggil berulang kali.
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName,
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname()
  const lastClickRef = useRef(0)

  const isActive = pathname === href || pathname.startsWith(href + '/')

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow modifier keys (open in new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const now = Date.now()

      // Debounce: ignore clicks within 600ms of last click
      if (now - lastClickRef.current < 600) {
        e.preventDefault()
        return
      }

      // If already on the same page, prevent navigation
      if (pathname === href) {
        e.preventDefault()
        return
      }

      lastClickRef.current = now
      onNavigate?.()
    },
    [href, pathname, onNavigate]
  )

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        className,
        isActive && activeClassName
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}
