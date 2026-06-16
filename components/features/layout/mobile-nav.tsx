'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { navigation, APP_BRAND } from './navigation'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 left-0 w-72 glass z-50 md:hidden animate-slide-in-right shadow-2xl">
        <div className="p-6 flex items-center justify-between border-b border-white/20 dark:border-gray-700/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <div className="p-2 rounded-xl bg-gradient-hero shadow-glow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {APP_BRAND.name}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-hero text-white shadow-glow'
                    : 'text-gray-700 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-lg',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {item.name}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5',
                      isActive
                        ? 'text-white/80'
                        : 'text-gray-500 dark:text-gray-500'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
