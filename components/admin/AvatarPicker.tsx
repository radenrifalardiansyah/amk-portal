'use client'

import { useRef, useState } from 'react'
import { theme } from '@/lib/admin-theme'
import { uploadMedia, uploadErrorMessage } from '@/lib/upload'

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

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onError?.('File harus berupa gambar')
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
    </div>
  )
}
