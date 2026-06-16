import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  gradient?: 'hero' | 'cool' | 'warm' | 'success' | 'purple' | 'pink' | 'warning'
  suffix?: string
  subtitle?: string
  className?: string
  iconClassName?: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    label: string
  }
}

const GRADIENT_MAP = {
  hero: 'bg-blue-600',
  cool: 'bg-cyan-600',
  warm: 'bg-orange-600',
  success: 'bg-emerald-600',
  purple: 'bg-violet-600',
  pink: 'bg-pink-600',
  warning: 'bg-amber-600',
} as const

const GLOW_MAP = {
  hero: '',
  cool: '',
  warm: '',
  success: '',
  purple: '',
  pink: '',
  warning: '',
} as const

export function StatCard({
  label,
  value,
  icon: Icon,
  gradient = 'hero',
  suffix,
  subtitle,
  className,
  iconClassName,
  trend,
}: StatCardProps) {
  const isGradient = !!Icon
  let trendArrow = '→'
  let trendColor = 'text-gray-500 dark:text-gray-400'
  if (trend) {
    trendArrow =
      trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'
    if (trend.direction === 'up') {
      trendColor = 'text-emerald-600 dark:text-emerald-400'
    } else if (trend.direction === 'down') {
      trendColor = 'text-red-600 dark:text-red-400'
    } else {
      trendColor = 'text-gray-500 dark:text-gray-400'
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden relative transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5',
        className
      )}
    >
      {isGradient && (
        <div
          className={cn(
            'absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-30 -mr-12 -mt-12',
            GRADIENT_MAP[gradient]
          )}
        />
      )}
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          {Icon && (
            <div
              className={cn(
                'p-2 rounded-lg shadow-sm',
                GRADIENT_MAP[gradient],
                GLOW_MAP[gradient],
                iconClassName
              )}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
            {value}
          </p>
          {suffix && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {suffix}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={cn('text-xs mt-2 flex items-center gap-1', trendColor)}>
            <span className="font-bold">{trendArrow}</span>
            <span>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface GradientIconProps {
  icon: LucideIcon
  gradient?: StatCardProps['gradient']
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GradientIcon({
  icon: Icon,
  gradient = 'hero',
  size = 'md',
  className,
}: GradientIconProps) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size]

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  }[size]

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl shadow-sm',
        GRADIENT_MAP[gradient],
        sizeClass,
        GLOW_MAP[gradient],
        className
      )}
    >
      <Icon className={cn('text-white', iconSize)} />
    </div>
  )
}
