'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { theme } from '@/lib/admin-theme'
import { uploadMedia, uploadErrorMessage, validateImageFile, MAX_SOURCE_MB, SUPPORTED_IMAGE_FORMATS_LABEL } from '@/lib/upload'

interface MediaUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  aspect?: string
  squareCrop?: boolean
  onUploadingChange?: (uploading: boolean) => void
  onError?: (message: string) => void
}

export default function MediaUploadField({
  label, value, onChange, folder, aspect = 'aspect-video', squareCrop,
  onUploadingChange, onError,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'file' | 'link'>('file')
  const [linkDraft, setLinkDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const previewSrc = localPreview || value

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const applyLink = () => {
    const url = linkDraft.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      onError?.('Link harus diawali http:// atau https://')
      return
    }
    onChange(url)
    setLinkDraft('')
  }

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    try {
      validateImageFile(file)
    } catch (err) {
      onError?.(uploadErrorMessage(err))
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setUploading(true)
    onUploadingChange?.(true)
    setProgress(0)
    try {
      const url = await uploadMedia(file, folder, setProgress, squareCrop)
      onChange(url)
    } catch (err) {
      console.error('Upload failed:', err)
      onError?.(uploadErrorMessage(err))
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
      setLocalPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  const tabStyle = (active: boolean) => ({
    padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' as const,
    background: active ? theme.accentSoftHover : 'transparent',
    color: active ? theme.accentText : theme.textMuted,
  })

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: -2, marginBottom: 8 }}>
        Format {SUPPORTED_IMAGE_FORMATS_LABEL} &middot; maks {MAX_SOURCE_MB}MB (otomatis dikompres)
      </p>
      <div style={{ display: 'inline-flex', gap: 4, padding: 3, borderRadius: 10, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, marginBottom: 8 }}>
        <button type="button" style={tabStyle(mode === 'file')} onClick={() => setMode('file')}>Upload File</button>
        <button type="button" style={tabStyle(mode === 'link')} onClick={() => setMode('link')}>Pakai Link</button>
      </div>

      {mode === 'file' && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div
            className={`${aspect} relative w-full overflow-hidden rounded-xl group`}
            style={{
              background: theme.surfaceSoft,
              border: `1.5px dashed ${dragOver ? theme.accent : theme.border}`,
              transition: 'border-color 0.15s',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (!uploading) handleFile(e.dataTransfer.files?.[0])
            }}
          >
            {previewSrc && (
              <Image src={previewSrc} alt={label} fill className="object-cover" unoptimized />
            )}
            {!previewSrc && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
                style={{ color: theme.textMuted }}
                onClick={() => !uploading && inputRef.current?.click()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                  add_photo_alternate
                </span>
                <p style={{ fontSize: 11.5 }}>Klik atau seret foto ke sini</p>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: previewSrc ? 'rgba(16,24,40,0.45)' : 'rgba(255,255,255,0.9)', pointerEvents: 'none' }}>
                <div className="w-6 h-6 border-4 rounded-full admin-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: theme.accent }} />
                <p style={{ fontSize: 11.5, color: previewSrc ? '#fff' : theme.textSecondary, fontWeight: 600 }}>Mengunggah... {progress}%</p>
              </div>
            )}

            {previewSrc && !uploading && (
              <div
                className="opacity-0 group-hover:opacity-100"
                style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, transition: 'opacity 0.15s' }}
              >
                <button
                  type="button"
                  title="Ganti foto"
                  onClick={() => inputRef.current?.click()}
                  style={{ padding: 6, borderRadius: 8, background: 'rgba(16,24,40,0.55)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>upload</span>
                </button>
                <button
                  type="button"
                  title="Hapus"
                  onClick={() => onChange('')}
                  style={{ padding: 6, borderRadius: 8, background: 'rgba(16,24,40,0.55)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'link' && (
        <div
          className={`${aspect} relative w-full overflow-hidden rounded-xl group`}
          style={{ background: theme.surfaceSoft, border: `1.5px dashed ${theme.border}` }}
        >
          {previewSrc && (
            <Image src={previewSrc} alt={label} fill className="object-cover" unoptimized />
          )}
          {!previewSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: theme.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>link</span>
              <p style={{ fontSize: 11.5 }}>Masukkan link gambar di bawah</p>
            </div>
          )}

          {previewSrc && (
            <button
              type="button"
              title="Hapus"
              onClick={() => onChange('')}
              className="opacity-0 group-hover:opacity-100"
              style={{ position: 'absolute', top: 8, right: 8, padding: 6, borderRadius: 8, background: 'rgba(16,24,40,0.55)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', transition: 'opacity 0.15s' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
            </button>
          )}

          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', gap: 6 }}>
            <input
              type="url"
              placeholder="https://..."
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } }}
              style={{ flex: 1, fontSize: 11.5, padding: '7px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface, color: theme.text }}
            />
            <button
              type="button"
              onClick={applyLink}
              style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
