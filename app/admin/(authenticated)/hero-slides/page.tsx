'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import SafeImage from '@/components/SafeImage'
import VideoCoverThumb from '@/components/VideoCoverThumb'
import MediaUploadField from '@/components/admin/MediaUploadField'
import SearchSelect from '@/components/admin/SearchSelect'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import { heroSlidesService, DEFAULT_HERO_TITLE_SIZE } from '@/lib/services'
import type { HeroSlide } from '@/lib/services'
import { revalidatePaths } from '@/lib/revalidate'
import { getVideoEmbed } from '@/lib/videoEmbed'
import { useMediaTypeDrafts } from '@/lib/useMediaTypeDrafts'
import { usePermission } from '@/lib/permissions'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptySlide: HeroSlide = {
  id: '', order: 1, badge: '',
  titleLine1: '', titleLine2: '', titleLine3: '',
  titleLine1Size: DEFAULT_HERO_TITLE_SIZE, titleLine2Size: DEFAULT_HERO_TITLE_SIZE, titleLine3Size: DEFAULT_HERO_TITLE_SIZE,
  description: '', primaryCtaLabel: '', primaryCtaHref: '', secondaryCtaLabel: '', secondaryCtaHref: '',
  image: '', imageType: 'image',
}

const TITLE_SIZE_OPTIONS = [
  { label: 'Kecil', value: 'text-4xl md:text-5xl' },
  { label: 'Sedang', value: 'text-5xl md:text-6xl' },
  { label: 'Besar', value: 'text-6xl md:text-7xl' },
  { label: 'Sangat Besar (Default)', value: 'text-6xl md:text-8xl' },
  { label: 'Ekstra Besar', value: 'text-7xl md:text-9xl' },
]

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

function SlideThumb({ slide, className }: { slide: HeroSlide; className: string }) {
  if (slide.imageType === 'video') {
    return (
      <div className="relative w-full h-full group">
        <VideoCoverThumb url={slide.image} alt={slide.titleLine1} className={className} />
      </div>
    )
  }
  return <SafeImage src={slide.image} alt={slide.titleLine1} fill className={className} />
}

function SlideModal({
  mode, item, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  item: Partial<HeroSlide>
  onClose: () => void
  onSave: (data: HeroSlide) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<HeroSlide>({ ...emptySlide, ...item })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const switchType = useMediaTypeDrafts(form.imageType, form.image)

  const set = <K extends keyof HeroSlide>(k: K, v: HeroSlide[K]) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image) { onError(form.imageType === 'video' ? 'Link video wajib diisi' : 'Gambar wajib diunggah'); return }
    if (!form.titleLine1.trim()) { onError('Judul Baris 1 wajib diisi'); return }
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: heroSlidesService.newId() } : form
    await onSave(data)
    setSaving(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-full flex items-start justify-center py-8">
      <div className="w-full max-w-2xl admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Slide Hero' : 'Edit Slide Hero'}
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
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div>
                <label style={labelStyle}>Badge</label>
                <input className={inputCls} style={inputStyle} value={form.badge}
                  placeholder="AMK Agency | Creative & Tech"
                  onChange={(e) => set('badge', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Urutan *</label>
                <input type="number" className={inputCls} style={{ ...inputStyle, width: 100 }} required value={form.order}
                  onChange={(e) => set('order', Number(e.target.value))}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Judul Baris 1 *</label>
                <input className={inputCls} style={inputStyle} required value={form.titleLine1}
                  onChange={(e) => set('titleLine1', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Judul Baris 2</label>
                <input className={inputCls} style={inputStyle} value={form.titleLine2}
                  onChange={(e) => set('titleLine2', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Judul Baris 3 (gradient)</label>
                <input className={inputCls} style={inputStyle} value={form.titleLine3}
                  onChange={(e) => set('titleLine3', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Ukuran Font Baris 1</label>
                <SearchSelect value={form.titleLine1Size} options={TITLE_SIZE_OPTIONS} onChange={(v) => set('titleLine1Size', v)} allowClear={false} />
              </div>
              <div>
                <label style={labelStyle}>Ukuran Font Baris 2</label>
                <SearchSelect value={form.titleLine2Size} options={TITLE_SIZE_OPTIONS} onChange={(v) => set('titleLine2Size', v)} allowClear={false} />
              </div>
              <div>
                <label style={labelStyle}>Ukuran Font Baris 3</label>
                <SearchSelect value={form.titleLine3Size} options={TITLE_SIZE_OPTIONS} onChange={(v) => set('titleLine3Size', v)} allowClear={false} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Deskripsi</label>
              <textarea rows={3} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.description}
                onChange={(e) => set('description', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>

            <div>
              <label style={labelStyle}>Gambar/Video Slide *</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {(['image', 'video'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((f) => ({ ...f, imageType: t, image: switchType(t) }))}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${form.imageType === t ? theme.accent : theme.border}`,
                      background: form.imageType === t ? theme.accentSoft : theme.surfaceSoft,
                      color: form.imageType === t ? theme.accentText : theme.textSecondary,
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t === 'image' ? 'image' : 'movie'}</span>
                    {t === 'image' ? 'Foto' : 'Video'}
                  </button>
                ))}
              </div>

              {form.imageType === 'image' ? (
                <MediaUploadField
                  label="" folder="homepage/hero-slides" aspect="aspect-[21/9]"
                  recommendedWidth={1600} recommendedHeight={686} cropToAspect
                  value={form.image} onChange={(url) => set('image', url)}
                  onUploadingChange={setUploading} onError={onError}
                />
              ) : (
                <>
                  <input className={inputCls} style={inputStyle} value={form.image}
                    placeholder="https://www.youtube.com/watch?v=... atau link mp4"
                    onChange={(e) => set('image', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  {form.image && (
                    <>
                      <div className="aspect-[21/9] relative w-full overflow-hidden rounded-xl mt-2" style={{ background: theme.surfaceSoft }}>
                        <VideoCoverThumb url={form.image} alt="Preview slide" />
                      </div>
                      <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
                        Terdeteksi sebagai: {getVideoEmbed(form.image).kind}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Label CTA Utama</label>
                <input className={inputCls} style={inputStyle} value={form.primaryCtaLabel}
                  onChange={(e) => set('primaryCtaLabel', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Link CTA Utama</label>
                <input className={inputCls} style={inputStyle} value={form.primaryCtaHref}
                  onChange={(e) => set('primaryCtaHref', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Label CTA Sekunder</label>
                <input className={inputCls} style={inputStyle} value={form.secondaryCtaLabel}
                  onChange={(e) => set('secondaryCtaLabel', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Link CTA Sekunder</label>
                <input className={inputCls} style={inputStyle} value={form.secondaryCtaHref}
                  onChange={(e) => set('secondaryCtaHref', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || uploading) ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: (saving || uploading) ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
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

export default function HeroSlidesPage() {
  const { edit, delete: canDelete } = usePermission('hero-slides')
  const { data: items = [], isLoading: loading, mutate } = useSWR('heroSlides', heroSlidesService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item: Partial<HeroSlide> } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: HeroSlide) => {
    try {
      await heroSlidesService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Slide hero berhasil ditambahkan!' : 'Slide hero berhasil diperbarui!')
      revalidatePaths([{ path: '/', type: 'layout' }])
    } catch {
      showToast('error', 'Gagal menyimpan slide hero')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus slide "${title || '(tanpa judul)'}"?`)) return
    setDeletingId(id)
    try {
      await heroSlidesService.delete(id)
      await mutate()
      showToast('success', 'Slide hero berhasil dihapus')
      revalidatePaths([{ path: '/', type: 'layout' }])
    } catch {
      showToast('error', 'Gagal menghapus slide hero')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = items.length ? Math.max(...items.map((i) => i.order)) + 1 : 1
  const paginated = items.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <SlideModal mode={modal.mode} item={modal.item} onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, padding: '14px 20px' }}>
        <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.5 }}>
          Setiap slide tampil bergantian di section Hero halaman utama. Jika belum ada slide sama sekali, Hero akan menampilkan konten lama dari menu <strong>Home &rarr; Hero</strong> sebagai fallback.
          Tambahkan minimal 2 slide agar slider otomatis berputar.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>
          {items.length} Slide{items.length !== 1 ? '' : ''}
        </h2>
        {edit && (
          <button onClick={() => setModal({ mode: 'add', item: { order: nextOrder, imageType: 'image' } })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(7,82,183,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span><span className="hidden sm:inline">Tambah Slide</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat slide hero...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>view_carousel</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>Belum ada slide hero</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Tambahkan slide baru untuk mulai menampilkan slider di homepage</p>
          </div>
          {edit && (
            <button onClick={() => setModal({ mode: 'add', item: { order: nextOrder, imageType: 'image' } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(7,82,183,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Slide
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((i, idx) => (
            <div key={i.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${idx * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div className="aspect-[21/9] relative overflow-hidden w-full" style={{ background: theme.surfaceSoft }}>
                <SlideThumb slide={i} className="object-cover w-full h-full" />
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, color: theme.textMuted, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', border: `1px solid ${theme.border}` }}>
                    #{i.order}
                  </span>
                  {i.imageType === 'video' && (
                    <span style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, color: '#fff', background: 'rgba(16,24,40,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>movie</span>Video
                    </span>
                  )}
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                {i.badge && <p style={{ fontSize: 10, fontWeight: 600, color: theme.accentText, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }} className="line-clamp-1">{i.badge}</p>}
                <p style={{ fontWeight: 700, color: theme.text, fontSize: 13, lineHeight: 1.35, marginBottom: 10 }} className="line-clamp-1">
                  {[i.titleLine1, i.titleLine2, i.titleLine3].filter(Boolean).join(' ') || '(Tanpa judul)'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', item: i })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(i.id, i.titleLine1)} disabled={deletingId === i.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === i.id
                      ? <span className="w-3 h-3 border-2 rounded-full admin-spin" style={{ borderColor: 'rgba(220,38,38,0.25)', borderTopColor: theme.danger }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>}
                    Hapus
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={items.length} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
