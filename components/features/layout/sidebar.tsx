'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation, APP_BRAND } from './navigation'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col w-64 glass sticky top-[88px] h-[calc(100vh-88px)]">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-gradient-hero text-white shadow-glow'
                  : 'text-gray-700 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800/60'
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-hero opacity-100" />
              )}
              <span
                className={cn(
                  'relative z-10 flex items-center gap-3',
                  isActive && 'text-white'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary/10 group-hover:scale-110'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-primary'
                    )}
                  />
                </span>
                <div className="flex-1">
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
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-white/20 dark:border-gray-700/50">
        <div className="rounded-xl p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
            {APP_BRAND.name}
          </p>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            {APP_BRAND.tagline} v1.0
          </p>
        </div>
      </div>
    </aside>
  )
}
