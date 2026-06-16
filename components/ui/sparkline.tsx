'use client'

import { useId } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  showDots?: boolean
  className?: string
}

/**
 * Lightweight SVG sparkline (no recharts dependency for tiny visualizations).
 * Renders a smooth line with optional area fill and end-point dot.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = '#3b82f6',
  fillColor,
  showDots = false,
  className,
}: SparklineProps) {
  const id = useId()

  if (!data || data.length < 2) {
    return (
      <div
        className={className}
        style={{ width, height }}
        aria-hidden="true"
      />
    )
  }

  const padding = 2
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const stepX = innerWidth / (data.length - 1)
  const points = data.map((v, i) => {
    const x = padding + i * stepX
    const y = padding + innerHeight - ((v - min) / range) * innerHeight
    return [x, y] as [number, number]
  })

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')

  const areaD =
    `${pathD} L${points[points.length - 1][0].toFixed(2)},${(padding + innerHeight).toFixed(2)}` +
    ` L${points[0][0].toFixed(2)},${(padding + innerHeight).toFixed(2)} Z`

  const endPoint = points[points.length - 1]
  const fill = fillColor ?? `${color}33` // 20% opacity hex suffix

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.5}
            fill={color}
            opacity={i === points.length - 1 ? 1 : 0.5}
          />
        ))}
      <circle
        cx={endPoint[0]}
        cy={endPoint[1]}
        r={2.5}
        fill={color}
        stroke="white"
        strokeWidth={1.5}
      />
    </svg>
  )
}
