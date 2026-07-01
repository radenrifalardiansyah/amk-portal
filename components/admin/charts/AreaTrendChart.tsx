'use client'

import { useId, useState } from 'react'
import { theme } from '@/lib/admin-theme'

export interface TrendPoint {
  label: string
  value: number
}

interface AreaTrendChartProps {
  data: TrendPoint[]
  color?: string
  height?: number
}

const WIDTH = 600

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x},${points[0].y}`
  let path = `M${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const mx = (p0.x + p1.x) / 2
    const my = (p0.y + p1.y) / 2
    path += ` Q${p0.x},${p0.y} ${mx},${my}`
  }
  const last = points[points.length - 1]
  path += ` L${last.x},${last.y}`
  return path
}

export default function AreaTrendChart({ data, color = theme.accent, height = 180 }: AreaTrendChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const padTop = 16
  const padBottom = 24
  const padX = 8
  const plotH = height - padTop - padBottom
  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? (WIDTH - padX * 2) / (data.length - 1) : 0

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padTop + plotH - (d.value / max) * plotH,
  }))

  const linePath = buildSmoothPath(points)
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x},${padTop + plotH} L${points[0].x},${padTop + plotH} Z`
    : ''

  const labelEvery = Math.ceil(data.length / 7)

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX} x2={WIDTH - padX}
            y1={padTop + plotH * t} y2={padTop + plotH * t}
            stroke={theme.divider} strokeWidth={1}
          />
        ))}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />}

        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
            <rect x={p.x - stepX / 2} y={0} width={Math.max(stepX, 1)} height={height} fill="transparent" style={{ cursor: 'pointer' }} />
            <circle
              cx={p.x} cy={p.y}
              r={hoverIndex === i ? 4.5 : 3}
              fill={theme.surface}
              stroke={color}
              strokeWidth={2}
              style={{ transition: 'r 0.12s' }}
            />
            {hoverIndex === i && (
              <>
                <line x1={p.x} x2={p.x} y1={padTop} y2={padTop + plotH} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
                <g>
                  <rect x={p.x - 20} y={p.y - 30} width={40} height={20} rx={6} fill={theme.text} />
                  <text x={p.x} y={p.y - 16} textAnchor="middle" fontSize="11" fontWeight={700} fill="#fff">
                    {data[i].value}
                  </text>
                </g>
              </>
            )}
          </g>
        ))}

        {data.map((d, i) => (
          i % labelEvery === 0 && (
            <text
              key={i}
              x={points[i].x}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fill={theme.textMuted}
            >
              {d.label}
            </text>
          )
        ))}
      </svg>
    </div>
  )
}
