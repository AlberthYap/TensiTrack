'use client'

import { User } from '@supabase/supabase-js'
import { LogOut, Loader2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { useTransition } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from './mobile-nav'

interface HeaderProps {
  user: User
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }
  return (email || 'U')[0].toUpperCase()
}

export function Header({ user }: HeaderProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  const fullName = user.user_metadata?.full_name as string | undefined
  const initials = getInitials(fullName, user.email)

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-white/20 dark:border-gray-700/50">
        <div className="px-4 md:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              {/* Mobile menu trigger (drawer self-contained) */}
              <MobileNav />

              {/* Mobile brand */}
              <div className="md:hidden flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 flex-shrink-0">
                  <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white truncate">
                  Tensi Harian
                </span>
              </div>

              <div className="hidden md:block min-w-0">
                <h1 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Selamat datang,{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {fullName || 'Pengguna'}
                  </span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Pantau tekanan darah Anda hari ini
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-full bg-white/40 dark:bg-gray-800/40 border border-white/40 dark:border-gray-700/50">
                <div className="relative w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {fullName || 'Pengguna'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isPending}
                type="button"
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
