'use client'

import { useEffect, useRef, useState } from 'react'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

export interface SearchSelectOption {
  value: string
  label: string
  icon?: string
}

export default function SearchSelect({
  value, options, onChange, placeholder = 'Pilih...', clearLabel = 'Tidak dihubungkan', allowClear = true, disabled,
}: {
  value: string
  options: SearchSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  clearLabel?: string
  allowClear?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = options.find((o) => o.value === value)
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
        style={{ ...inputStyle, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: selected ? theme.text : theme.textMuted, overflow: 'hidden' }}>
          {selected?.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected ? selected.label : placeholder}</span>
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: theme.textMuted, flexShrink: 0 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, boxShadow: theme.shadowElevated, overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${theme.divider}` }}>
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari..."
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {allowClear && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery('') }}
                style={{ width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.surfaceSoft }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
              >
                {clearLabel}
              </button>
            )}
            {filtered.length === 0 && (
              <p style={{ padding: '10px 14px', fontSize: 12.5, color: theme.textMuted }}>Tidak ditemukan</p>
            )}
            {filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQuery('') }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '9px 14px', fontSize: 13, background: o.value === value ? theme.accentSoft : 'none', border: 'none', cursor: 'pointer', color: o.value === value ? theme.accentText : theme.text }}
                onMouseEnter={(e) => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = theme.surfaceSoft }}
                onMouseLeave={(e) => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
              >
                {o.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.icon} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
