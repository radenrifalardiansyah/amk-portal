'use client'

import { useRef, useState } from 'react'
import { theme } from '@/lib/admin-theme'
import { uploadMedia, uploadErrorMessage, validateImageFile } from '@/lib/upload'

export default function AvatarPicker({
  value, onChange, fallback = '?', size = 44, onError,
}: {
  value?: string
  onChange: (url: string) => void
  fallback?: string
  size?: number
  onError?: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    try {
      validateImageFile(file)
    } catch (err) {
      onError?.(uploadErrorMessage(err))
      return
    }
    setUploading(true)
    try {
      const url = await uploadMedia(file, 'members')
      onChange(url)
    } catch (err) {
      console.error('Upload failed:', err)
      onError?.(uploadErrorMessage(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const applyLink = () => {
    const url = linkDraft.trim()
    if (!url) { setLinkMode(false); return }
    if (!/^https?:\/\//i.test(url)) {
      onError?.('Link harus diawali http:// atau https://')
      return
    }
    onChange(url)
    setLinkDraft('')
    setLinkMode(false)
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        title="Ganti foto"
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: 'none',
          cursor: uploading ? 'wait' : 'pointer', padding: 0, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: value ? theme.surfaceSoft : `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
          color: '#fff', fontSize: size * 0.32, fontWeight: 700, textTransform: 'uppercase',
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : fallback.slice(0, 2)}

        {uploading && (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,24,40,0.5)' }}>
            <span className="admin-spin" style={{ width: size * 0.4, height: size * 0.4, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'block' }} />
          </span>
        )}

        {!uploading && (
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute', bottom: -2, right: -2, fontSize: Math.max(12, size * 0.34),
              background: theme.surface, color: theme.textSecondary, borderRadius: '50%',
              border: `1.5px solid ${theme.surface}`, boxShadow: theme.shadowCard, padding: 1,
            }}
          >
            photo_camera
          </span>
        )}
      </button>

      {!uploading && (
        <button
          type="button"
          title="Pakai link gambar"
          onClick={(e) => { e.stopPropagation(); setLinkMode((m) => !m) }}
          style={{
            position: 'absolute', bottom: -2, left: -2, fontSize: Math.max(11, size * 0.28),
            background: theme.surface, color: theme.textSecondary, borderRadius: '50%',
            border: `1.5px solid ${theme.surface}`, boxShadow: theme.shadowCard, padding: 1,
            display: 'flex', cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>link</span>
        </button>
      )}

      {linkMode && (
        <div
          style={{
            position: 'absolute', top: size + 6, left: 0, zIndex: 20, width: 220,
            background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10,
            boxShadow: theme.shadowElevated, padding: 8, display: 'flex', gap: 6,
          }}
        >
          <input
            type="url"
            autoFocus
            placeholder="https://..."
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') setLinkMode(false)
            }}
            style={{ flex: 1, minWidth: 0, fontSize: 11.5, padding: '5px 7px', borderRadius: 6, border: `1px solid ${theme.border}`, color: theme.text }}
          />
          <button
            type="button"
            onClick={applyLink}
            style={{ fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 6, background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
