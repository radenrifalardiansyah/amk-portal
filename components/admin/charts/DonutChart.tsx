'use client'

import { useState } from 'react'
import { theme } from '@/lib/admin-theme'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
}

export default function DonutChart({ segments, size = 150, thickness = 20 }: DonutChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = size / 2 - thickness / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = segments.map((s, i) => {
    const fraction = total > 0 ? s.value / total : 0
    const dash = fraction * circumference
    const arc = { ...s, dash, offset, index: i }
    offset += dash
    return arc
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.divider} strokeWidth={thickness} />
          {total > 0 && arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={hoverIndex === a.index ? thickness + 3 : thickness}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
              onMouseEnter={() => setHoverIndex(a.index)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, lineHeight: 1 }}>
            {hoverIndex !== null ? segments[hoverIndex].value : total}
          </span>
          <span style={{ fontSize: 9.5, color: theme.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {hoverIndex !== null ? segments[hoverIndex].label : 'Total'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 120 }}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: theme.textSecondary, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
