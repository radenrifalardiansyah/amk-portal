'use client'

import { theme } from '@/lib/admin-theme'

interface PaginationProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const pages: number[] = []
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  for (let p = start; p <= end; p++) pages.push(p)

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 32, height: 32, padding: '0 6px', borderRadius: 9,
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
  } as const

  return (
    <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: 18 }}>
      <p style={{ fontSize: 12.5, color: theme.textMuted }}>
        Menampilkan <strong style={{ color: theme.textSecondary }}>{from}-{to}</strong> dari <strong style={{ color: theme.textSecondary }}>{totalItems}</strong>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ ...btnBase, background: theme.surfaceSoft, color: page <= 1 ? theme.textMuted : theme.textSecondary, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
        </button>
        {start > 1 && <span style={{ padding: '0 4px', fontSize: 12, color: theme.textMuted }}>…</span>}
        {pages.map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            style={{ ...btnBase, background: p === page ? theme.accent : theme.surfaceSoft, color: p === page ? '#fff' : theme.textSecondary }}>
            {p}
          </button>
        ))}
        {end < totalPages && <span style={{ padding: '0 4px', fontSize: 12, color: theme.textMuted }}>…</span>}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ ...btnBase, background: theme.surfaceSoft, color: page >= totalPages ? theme.textMuted : theme.textSecondary, opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'default' : 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
