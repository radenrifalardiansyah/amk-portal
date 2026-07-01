'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { theme } from '@/lib/admin-theme'
import { uploadMedia } from '@/lib/upload'

const MAX_IMAGE_MB = 8
const MAX_VIDEO_MB = 100

interface MediaUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  folder: string
  kind?: 'image' | 'video'
  aspect?: string
  onUploadingChange?: (uploading: boolean) => void
  onError?: (message: string) => void
}

export default function MediaUploadField({
  label, value, onChange, folder, kind = 'image', aspect = 'aspect-video',
  onUploadingChange, onError,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const accept = kind === 'video' ? 'video/*' : 'image/*'
  const maxMb = kind === 'video' ? MAX_VIDEO_MB : MAX_IMAGE_MB
  const previewSrc = localPreview || value

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith(kind === 'video' ? 'video/' : 'image/')) {
      onError?.(`File harus berupa ${kind === 'video' ? 'video' : 'gambar'}`)
      return
    }
    if (file.size > maxMb * 1024 * 1024) {
      onError?.(`Ukuran file maksimal ${maxMb}MB`)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setUploading(true)
    onUploadingChange?.(true)
    setProgress(0)
    try {
      const url = await uploadMedia(file, folder, setProgress)
      onChange(url)
    } catch {
      onError?.('Gagal mengunggah file. Coba lagi.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
      setLocalPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
        {previewSrc && kind === 'image' && (
          <Image src={previewSrc} alt={label} fill className="object-cover" unoptimized />
        )}
        {previewSrc && kind === 'video' && (
          <video src={previewSrc} className="w-full h-full object-cover" controls={!uploading} muted={uploading} />
        )}
        {!previewSrc && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
            style={{ color: theme.textMuted }}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
              {kind === 'video' ? 'movie' : 'add_photo_alternate'}
            </span>
            <p style={{ fontSize: 11.5 }}>Klik atau seret {kind === 'video' ? 'video' : 'foto'} ke sini</p>
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
              title={`Ganti ${kind === 'video' ? 'video' : 'foto'}`}
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
    </div>
  )
}
