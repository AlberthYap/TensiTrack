'use client'

import { LIFESTYLE_TAGS } from '@/lib/lifestyle-tags'

interface TagSelectorProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter((t) => t !== key)
      : [...selected, key]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {LIFESTYLE_TAGS.map((tag) => {
        const active = selected.includes(tag.key)
        return (
          <button
            key={tag.key}
            type="button"
            onClick={() => toggle(tag.key)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
              border transition-all
              ${
                active
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
              }
            `}
          >
            {tag.emoji} {tag.label}
          </button>
        )
      })}
    </div>
  )
}
