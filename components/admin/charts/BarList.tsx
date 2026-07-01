'use client'

import { theme } from '@/lib/admin-theme'

export interface BarListItem {
  label: string
  value: number
  color: string
}

interface BarListProps {
  items: BarListItem[]
}

export default function BarList({ items }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value))

  if (items.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: theme.textMuted }}>Belum ada data</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: theme.textSecondary }}>{item.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.text }}>{item.value}</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: theme.divider, overflow: 'hidden' }}>
            <div
              className="admin-fade-up"
              style={{
                height: '100%',
                borderRadius: 999,
                width: `${(item.value / max) * 100}%`,
                background: item.color,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
