'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { galleryService } from '@/lib/services'
import type { GalleryItem } from '@/lib/services'
import Image from 'next/image'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { revalidatePaths } from '@/lib/revalidate'
import { getVideoEmbed } from '@/lib/videoEmbed'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyItem: GalleryItem = { id: '', title: '', type: 'image', url: '', order: 1 }

function GalleryThumb({ item, className }: { item: GalleryItem; className: string }) {
  if (item.type === 'video') {
    const embed = getVideoEmbed(item.url)
    return (
      <>
        {embed.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={embed.thumbnailUrl} alt={item.title} className={className} />
        ) : (
          <div className={`${className} flex items-center justify-center`} style={{ background: theme.surfaceSoft }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: theme.textMuted }}>movie</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(16,24,40,0.25)' }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>play_circle</span>
        </div>
      </>
    )
  }
  return item.url ? <Image src={item.url} alt={item.title} fill className={className} unoptimized /> : null
}

function PreviewModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const embed = item.type === 'video' ? getVideoEmbed(item.url) : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
      style={{ background: 'rgba(16,24,40,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Tutup"
        style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 30 }}>close</span>
      </button>

      <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
        {item.type === 'image' ? (
          <Image src={item.url} alt={item.title} fill unoptimized className="object-contain" />
        ) : embed?.kind === 'file' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={embed.embedUrl} controls autoPlay className="w-full h-full object-contain" />
        ) : (
          <iframe
            src={embed?.embedUrl}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      <p style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: theme.fontHeadline, textAlign: 'center', padding: '0 16px' }}>
        {item.title}
      </p>
    </div>,
    document.body
  )
}

function GalleryModal({
  mode, item, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  item: Partial<GalleryItem>
  onClose: () => void
  onSave: (data: GalleryItem) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<GalleryItem>({ ...emptyItem, ...item })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof GalleryItem, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url) { onError(form.type === 'video' ? 'Link video wajib diisi' : 'Foto wajib diunggah'); return }
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: galleryService.newId() } : form
    await onSave(data)
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-full flex items-start justify-center py-8">
      <div className="w-full max-w-lg admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Item Galeri' : 'Edit Item Galeri'}
          </h3>
          <button onClick={onClose}
            style={{ padding: 8, borderRadius: 8, background: theme.surfaceSoft, border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.text; b.style.background = theme.border }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textSecondary; b.style.background = theme.surfaceSoft }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label style={labelStyle}>Tipe *</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['image', 'video'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t, url: '' }))}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${form.type === t ? theme.accent : theme.border}`,
                      background: form.type === t ? theme.accentSoft : theme.surfaceSoft,
                      color: form.type === t ? theme.accentText : theme.textSecondary,
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t === 'image' ? 'image' : 'movie'}</span>
                    {t === 'image' ? 'Foto' : 'Video'}
                  </button>
                ))}
              </div>
            </div>

            {form.type === 'image' ? (
              <MediaUploadField
                label="Foto Galeri *" folder="gallery" aspect="aspect-[4/3]"
                value={form.url} onChange={(url) => set('url', url)}
                onUploadingChange={setUploading} onError={onError}
              />
            ) : (
              <div>
                <label style={labelStyle}>Link Video *</label>
                <input className={inputCls} style={inputStyle} value={form.url}
                  placeholder="https://www.youtube.com/watch?v=... atau link mp4"
                  onChange={(e) => set('url', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                {form.url && (
                  <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
                    Terdeteksi sebagai: {getVideoEmbed(form.url).kind}
                  </p>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>Judul *</label>
              <input className={inputCls} style={inputStyle} required value={form.title}
                placeholder="Behind the Scene Shooting Nippon Express"
                onChange={(e) => set('title', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Urutan *</label>
              <input type="number" className={inputCls} style={inputStyle} required value={form.order}
                onChange={(e) => set('order', Number(e.target.value))}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${theme.divider}` }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.text }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary }}>
              Batal
            </button>
            <button type="submit" disabled={saving || uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || uploading) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || uploading) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>,
    document.body
  )
}

export default function GalleryPage() {
  const { data: items = [], isLoading: loading, mutate } = useSWR('gallery', galleryService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item: Partial<GalleryItem> } | null>(null)
  const [preview, setPreview] = useState<GalleryItem | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: GalleryItem) => {
    try {
      await galleryService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Item galeri berhasil ditambahkan!' : 'Item galeri berhasil diperbarui!')
      revalidatePaths(['/', '/gallery'])
    } catch {
      showToast('error', 'Gagal menyimpan item galeri')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus item "${title}"?`)) return
    setDeletingId(id)
    try {
      await galleryService.delete(id)
      await mutate()
      showToast('success', 'Item galeri berhasil dihapus')
      revalidatePaths(['/', '/gallery'])
    } catch {
      showToast('error', 'Gagal menghapus item galeri')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = items.length ? Math.max(...items.map((i) => i.order)) + 1 : 1

  const filtered = items.filter((i) => {
    if (!search) return true
    return i.title.toLowerCase().includes(search.toLowerCase())
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <GalleryModal mode={modal.mode} item={modal.item} onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}
      {preview && (
        <PreviewModal item={preview} onClose={() => setPreview(null)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari item galeri..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
          {(['grid', 'table'] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setPage(1) }}
              style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setModal({ mode: 'add', item: { order: nextOrder, type: 'image' } })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Item
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat galeri...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>collections</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada item galeri'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan foto atau video baru untuk mulai mengisi galeri'}</p>
          </div>
          {!search && (
            <button onClick={() => setModal({ mode: 'add', item: { order: nextOrder, type: 'image' } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Item
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((i, idx) => (
            <div key={i.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${idx * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <button
                type="button"
                onClick={() => setPreview(i)}
                className="aspect-[4/3] relative overflow-hidden w-full group/thumb"
                style={{ background: theme.surfaceSoft, cursor: 'zoom-in' }}
              >
                <GalleryThumb item={i} className="object-cover w-full h-full" />
                <div
                  className="opacity-0 group-hover/thumb:opacity-100"
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,24,40,0.35)', transition: 'opacity 0.15s' }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>zoom_in</span>
                </div>
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, color: theme.textMuted, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', border: `1px solid ${theme.border}` }}>
                    #{i.order}
                  </span>
                  {i.type === 'video' && (
                    <span style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, color: '#fff', background: 'rgba(16,24,40,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>movie</span>Video
                    </span>
                  )}
                </div>
              </button>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontWeight: 600, color: theme.text, fontSize: 12, lineHeight: 1.35, marginBottom: 10 }} className="line-clamp-1">{i.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <button onClick={() => setModal({ mode: 'edit', item: i })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>Edit
                  </button>
                  <button onClick={() => handleDelete(i.id, i.title)} disabled={deletingId === i.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === i.id
                      ? <span className="w-3 h-3 border-2 rounded-full admin-spin" style={{ borderColor: 'rgba(220,38,38,0.25)', borderTopColor: theme.danger }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>}
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
        </>
      ) : (
        <>
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['#', 'Preview', 'Judul', 'Tipe', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((i, idx) => (
                  <tr key={i.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + idx + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ width: 44, height: 44, position: 'relative', borderRadius: 8, overflow: 'hidden', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                        <GalleryThumb item={i} className="object-cover w-full h-full" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{i.title}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>
                        {i.type === 'video' ? 'Video' : 'Foto'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{i.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setPreview(i)}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                        <button onClick={() => setModal({ mode: 'edit', item: i })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(i.id, i.title)} disabled={deletingId === i.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === i.id
                            ? <span className="w-4 h-4 border-2 rounded-full admin-spin block" style={{ borderColor: theme.divider, borderTopColor: theme.danger }} />
                            : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
