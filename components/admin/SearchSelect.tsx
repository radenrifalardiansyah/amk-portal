'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

export interface SearchSelectOption {
  value: string
  label: string
  icon?: string
}

interface PanelCoords { left: number; width: number; top?: number; bottom?: number }

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
  const [coords, setCoords] = useState<PanelCoords | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updateCoords = () => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      setCoords({ left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 6 })
    } else {
      setCoords({ left: rect.left, width: rect.width, top: rect.bottom + 6 })
    }
  }

  useEffect(() => {
    if (!open) return
    updateCoords()
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false); setQuery('')
    }
    const onReposition = () => updateCoords()
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

  const selected = options.find((o) => o.value === value)
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
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

      {open && !disabled && coords && createPortal(
        <div ref={panelRef} style={{ position: 'fixed', left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom, zIndex: 200, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, boxShadow: theme.shadowElevated, overflow: 'hidden' }}>
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
        </div>,
        document.body
      )}
    </div>
  )
}
