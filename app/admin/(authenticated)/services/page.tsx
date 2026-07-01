'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import MediaUploadField from '@/components/admin/MediaUploadField'
import IconPickerField from '@/components/admin/IconPickerField'
import { servicesService, badgesService } from '@/lib/services'
import type { Badge } from '@/lib/services'
import { Service, ServiceFeature } from '@/data/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyService: Service = {
  slug: '', badge: '', title: '', subtitle: '', image: '', imageAlt: '', heading: '', body: '',
  features: [], ctaTitle: '', ctaLabel: '', navIcon: 'design_services', navTitle: '', navDescription: '',
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const FEATURE_PAGE_SIZE = 3

function ServiceModal({
  mode, service, badges, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  service: Partial<Service>
  badges: Badge[]
  onClose: () => void
  onSave: (data: Service) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<Service>({ ...emptyService, ...service })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [featurePage, setFeaturePage] = useState(1)

  const set = (k: keyof Service, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, slug: form.slug || slugify(form.title) } : form
    await onSave(data)
    setSaving(false)
  }

  const addFeature = () => {
    const features = [...form.features, { icon: 'star', title: '', description: '' }]
    setForm({ ...form, features })
    setFeaturePage(Math.ceil(features.length / FEATURE_PAGE_SIZE))
  }

  const removeFeature = (i: number) => {
    const features = form.features.filter((_, idx) => idx !== i)
    setForm({ ...form, features })
    setFeaturePage((p) => Math.min(p, Math.max(1, Math.ceil(features.length / FEATURE_PAGE_SIZE))))
  }

  const updateFeature = (i: number, patch: Partial<ServiceFeature>) => {
    setForm((f) => {
      const features = [...f.features]
      features[i] = { ...features[i], ...patch }
      return { ...f, features }
    })
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-full flex items-start justify-center py-8">
      <div className="w-full max-w-2xl lg:w-4/5 lg:max-w-none admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Service' : 'Edit Service'}
          </h3>
          <button onClick={onClose}
            style={{ padding: 8, borderRadius: 8, background: theme.surfaceSoft, border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.text; b.style.background = theme.border }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textSecondary; b.style.background = theme.surfaceSoft }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Judul *</label>
                <input className={inputCls} style={inputStyle} required value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Badge *</label>
                <select className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }} required value={form.badge}
                  onChange={(e) => set('badge', e.target.value)}>
                  <option value="">Pilih Badge</option>
                  {badges.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Slug *{mode === 'edit' && ' (ID dokumen, tidak dapat diubah)'}</label>
                <input className={inputCls} style={{ ...inputStyle, opacity: mode === 'edit' ? 0.6 : 1 }} required
                  value={form.slug} disabled={mode === 'edit'}
                  placeholder="cinematic"
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <IconPickerField
                  label="Nav Icon (Material Symbol) *"
                  value={form.navIcon}
                  placeholder="movie"
                  onChange={(icon) => set('navIcon', icon)}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nav Title *</label>
              <input className={inputCls} style={inputStyle} required value={form.navTitle}
                onChange={(e) => set('navTitle', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.subtitle}
                onChange={(e) => set('subtitle', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <MediaUploadField
              label="Foto Service" kind="image" folder="services"
              value={form.image} onChange={(url) => set('image', url)}
              onUploadingChange={setUploading} onError={onError}
            />
            <div>
              <label style={labelStyle}>Image Alt Text</label>
              <input className={inputCls} style={inputStyle} value={form.imageAlt}
                placeholder="Deskripsi singkat untuk foto (aksesibilitas & SEO)"
                onChange={(e) => set('imageAlt', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Heading</label>
              <input className={inputCls} style={inputStyle} value={form.heading}
                onChange={(e) => set('heading', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Body</label>
              <textarea rows={4} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.body}
                onChange={(e) => set('body', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>CTA Title</label>
                <input className={inputCls} style={inputStyle} value={form.ctaTitle}
                  onChange={(e) => set('ctaTitle', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>CTA Label</label>
                <input className={inputCls} style={inputStyle} value={form.ctaLabel}
                  onChange={(e) => set('ctaLabel', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Nav Description</label>
              <input className={inputCls} style={inputStyle} value={form.navDescription}
                onChange={(e) => set('navDescription', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Features</label>
                <button type="button" onClick={addFeature}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>Tambah Fitur
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.features
                  .map((f, idx) => ({ f, idx }))
                  .slice((featurePage - 1) * FEATURE_PAGE_SIZE, featurePage * FEATURE_PAGE_SIZE)
                  .map(({ f, idx }) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <IconPickerField
                        compact
                        value={f.icon}
                        placeholder="icon"
                        onChange={(icon) => updateFeature(idx, { icon })}
                      />
                      <input
                        style={{ flex: 1, padding: '6px 10px', fontSize: 13, borderRadius: 8, outline: 'none', ...inputStyle }}
                        value={f.title}
                        placeholder="Judul fitur"
                        onChange={(e) => updateFeature(idx, { title: e.target.value })}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                      />
                      <button type="button" onClick={() => removeFeature(idx)}
                        style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', flexShrink: 0 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.danger }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                    <textarea rows={2}
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 8, outline: 'none', resize: 'none', boxSizing: 'border-box', ...inputStyle }}
                      value={f.description}
                      placeholder="Deskripsi fitur"
                      onChange={(e) => updateFeature(idx, { description: e.target.value })}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                    />
                  </div>
                ))}
                {form.features.length === 0 && (
                  <p style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', padding: '12px 0' }}>Belum ada fitur</p>
                )}
                <Pagination page={featurePage} pageSize={FEATURE_PAGE_SIZE} totalItems={form.features.length} onPageChange={setFeaturePage} />
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

export default function ServicesPage() {
  const [servicesList, setServicesList] = useState<Service[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; service: Partial<Service> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [svc, bdg] = await Promise.all([servicesService.getAll(), badgesService.getAll()])
      setServicesList(svc)
      setBadges(bdg)
    } catch {
      showToast('error', 'Gagal memuat services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async (data: Service) => {
    try {
      await servicesService.save(data)
      await fetchAll()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Service berhasil ditambahkan!' : 'Service berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan service')
    }
  }

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Hapus service "${title}"?`)) return
    setDeletingId(slug)
    try {
      await servicesService.delete(slug)
      await fetchAll()
      showToast('success', 'Service berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus service')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = servicesList.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.navTitle.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.badge.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <ServiceModal mode={modal.mode} service={modal.service} badges={badges}
          onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari service..." value={search}
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

        <button onClick={() => setModal({ mode: 'add', service: {} })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Service
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat services...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.accent }}>design_services</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada services'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan service baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && (
            <button onClick={() => setModal({ mode: 'add', service: {} })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Service
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((s, i) => (
            <div key={s.slug}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.accent, fontVariationSettings: `'FILL' 1, 'wght' 400` }}>
                      {s.navIcon}
                    </span>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText, border: `1px solid ${theme.accentSoftBorder}` }}>
                    {s.badge}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 6, lineHeight: 1.3, fontFamily: theme.fontHeadline, fontSize: 14 }}>{s.navTitle}</h3>
                <p style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.55, marginBottom: 12 }} className="line-clamp-2">{s.navDescription}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: theme.textMuted }}>list_alt</span>
                  <span style={{ fontSize: 11.5, color: theme.textMuted }}>{s.features?.length ?? 0} fitur</span>
                  <span style={{ color: theme.border }}>·</span>
                  <span style={{ fontSize: 11.5, color: theme.textMuted }}>/{s.slug}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {(s.features ?? []).slice(0, 3).map((f) => (
                    <span key={f.title} style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 500, background: theme.surfaceSoft, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                      {f.title}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  <button onClick={() => setModal({ mode: 'edit', service: s })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  <button onClick={() => handleDelete(s.slug, s.title)} disabled={deletingId === s.slug}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === s.slug
                      ? <span className="w-3 h-3 border-2 rounded-full admin-spin" style={{ borderColor: 'rgba(220,38,38,0.25)', borderTopColor: theme.danger }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>}
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
                  {['#', 'Judul', 'Badge', 'Slug', 'Fitur', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr key={s.slug} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{s.navTitle}</span>
                      <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }} className="line-clamp-1">{s.navDescription}</p>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>{s.badge}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>/{s.slug}</td>
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{s.features?.length ?? 0} fitur</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setModal({ mode: 'edit', service: s })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(s.slug, s.title)} disabled={deletingId === s.slug}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === s.slug
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
