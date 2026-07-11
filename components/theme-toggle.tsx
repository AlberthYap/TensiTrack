'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type ThemeKey = 'light' | 'dark' | 'system'

const themes: { key: ThemeKey; label: string; icon: typeof Sun }[] = [
  { key: 'light', label: 'Terang', icon: Sun },
  { key: 'dark', label: 'Gelap', icon: Moon },
  { key: 'system', label: 'Sistem', icon: Monitor },
]

interface ThemeToggleProps {
  className?: string
}

function isThemeKey(value: string | undefined): value is ThemeKey {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return

    function onClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Stable icon before mount to avoid hydration mismatch
  const ActiveIcon = !mounted
    ? Sun
    : theme === 'dark'
      ? Moon
      : theme === 'system'
        ? Monitor
        : Sun

  const activeThemeKey: ThemeKey | undefined = mounted && isThemeKey(theme) ? theme : undefined

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Ganti tema"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg',
          'bg-white/40 dark:bg-gray-800/40 backdrop-blur-md',
          'border border-white/40 dark:border-gray-700/50',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-white/60 dark:hover:bg-gray-800/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'transition-colors'
        )}
      >
        <ActiveIcon className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Pilih tema"
          className={cn(
            'absolute right-0 mt-2 min-w-[180px] py-1.5 rounded-xl z-50',
            'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
            'border border-gray-200 dark:border-gray-700',
            'shadow-lg shadow-blue-900/5',
            'animate-scale-in origin-top-right'
          )}
        >
          {themes.map(({ key, label, icon: Icon }) => {
            const isActive = activeThemeKey === key
            return (
              <button
                key={key}
                role="menuitemradio"
                aria-checked={isActive}
                type="button"
                onClick={() => {
                  setTheme(key)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                  'text-gray-700 dark:text-gray-300',
                  'hover:bg-blue-50 dark:hover:bg-gray-800/60',
                  'focus-visible:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-gray-800/60',
                  isActive && 'bg-blue-50/70 dark:bg-gray-800/40 font-semibold'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
