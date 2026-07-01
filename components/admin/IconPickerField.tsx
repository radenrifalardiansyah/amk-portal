'use client'

import { useMemo, useState } from 'react'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

const ICONS = [
  'design_services', 'movie', 'videocam', 'photo_camera', 'photo_library', 'palette', 'brush', 'draw',
  'auto_awesome', 'campaign', 'trending_up', 'insights', 'analytics', 'bar_chart', 'show_chart',
  'groups', 'diversity_3', 'handshake', 'volunteer_activism', 'military_tech', 'workspace_premium',
  'verified', 'diamond', 'star', 'favorite', 'thumb_up', 'rocket_launch', 'bolt', 'lightbulb',
  'psychology', 'smart_toy', 'memory', 'code', 'terminal', 'developer_mode', 'integration_instructions',
  'api', 'cloud', 'security', 'shield', 'lock', 'language', 'public', 'travel_explore',
  'storefront', 'shopping_cart', 'sell', 'local_offer', 'loyalty', 'redeem', 'card_giftcard',
  'inventory_2', 'category', 'widgets', 'dashboard', 'settings', 'tune', 'build', 'construction',
  'engineering', 'science', 'biotech', 'business_center', 'work', 'corporate_fare', 'apartment', 'store',
  'record_voice_over', 'mic', 'headphones', 'music_note', 'theaters', 'live_tv', 'podcasts',
  'article', 'newspaper', 'description', 'assignment', 'checklist', 'task_alt', 'schedule',
  'calendar_month', 'event', 'location_on', 'map', 'flag', 'forum', 'chat', 'mail', 'call',
  'support_agent', 'contact_support', 'account_circle', 'group', 'monitor', 'devices',
]

interface IconPickerFieldProps {
  label?: string
  value: string
  onChange: (icon: string) => void
  placeholder?: string
  compact?: boolean
}

function IconGrid({ filtered, value, onPick }: { filtered: string[]; value: string; onPick: (icon: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
      {filtered.map((icon) => {
        const active = icon === value
        return (
          <button
            key={icon}
            type="button"
            title={icon}
            onClick={() => onPick(icon)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 8, borderRadius: 8, cursor: 'pointer',
              background: active ? theme.accentSoftHover : theme.surface,
              border: `1px solid ${active ? theme.accentSoftBorder : theme.border}`,
              color: active ? theme.accent : theme.textSecondary,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
          </button>
        )
      })}
      {filtered.length === 0 && (
        <p style={{ gridColumn: '1 / -1', fontSize: 11.5, color: theme.textMuted, textAlign: 'center', padding: '10px 0' }}>
          Tidak ditemukan, ketik manual saja di kolom input
        </p>
      )}
    </div>
  )
}

export default function IconPickerField({ label, value, onChange, placeholder, compact = false }: IconPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim().replace(/\s+/g, '_')
    if (!q) return ICONS
    return ICONS.filter((i) => i.includes(q))
  }, [search])

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }
  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'

  const pick = (icon: string) => { onChange(icon); setOpen(false); setSearch('') }

  if (compact) {
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            style={{ width: 76, flexShrink: 0, padding: '6px 10px', fontSize: 12, borderRadius: 8, outline: 'none', ...inputStyle }}
            value={value}
            placeholder={placeholder || 'icon'}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
          <button type="button" onClick={() => setOpen((o) => !o)} title="Pilih icon"
            style={{
              flexShrink: 0, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, color: open ? '#fff' : theme.accent,
              background: open ? theme.accent : theme.accentSoft,
              border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{value || 'apps'}</span>
          </button>
        </div>

        {open && (
          <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 30, width: 230, marginTop: 4, padding: 10, borderRadius: 12, background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowElevated }}>
            <input
              autoFocus
              className={inputCls}
              style={{ ...inputStyle, marginBottom: 8, padding: '6px 10px', fontSize: 12 }}
              placeholder="Cari icon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
            />
            <IconGrid filtered={filtered} value={value} onPick={pick} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: theme.accent }}>{value || 'help'}</span>
        </div>
        <input className={inputCls} style={inputStyle} required value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
        <button type="button" onClick={() => setOpen((o) => !o)}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            color: open ? '#fff' : theme.accentText,
            background: open ? theme.accent : theme.accentSoft,
            border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer', transition: 'all 0.15s',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>apps</span>
          Pilih
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 8, padding: 10, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
          <input
            autoFocus
            className={inputCls}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder="Cari icon... (mis. kamera, chart, star)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
          <IconGrid filtered={filtered} value={value} onPick={pick} />
        </div>
      )}
    </div>
  )
}
