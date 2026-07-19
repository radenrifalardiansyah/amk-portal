'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { portfolioService, servicesService, clientsService, siteContentService, Client } from '@/lib/services'
import type { PortfolioSectionContent } from '@/lib/services'
import { PortfolioProject, PortfolioGalleryItem, PortfolioStatus } from '@/data/portfolio'
import Image from 'next/image'
import MediaPlaceholder from '@/components/MediaPlaceholder'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import SearchSelect from '@/components/admin/SearchSelect'
import { getVideoEmbed } from '@/lib/videoEmbed'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyProject: PortfolioProject = {
  slug: '', category: '', title: '', description: '', image: '/images/company.png',
  client: '', clientId: null, services: '', year: new Date().getFullYear().toString(),
  challenge: '', solution: '', result: '', gallery: [], status: 'draft',
  prevSlug: null, nextSlug: null, nextLabel: null,
}

const newGalleryId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g${Math.random().toString(36).slice(2)}`)

function PortfolioModal({
  mode, project, categoryOptions, clients, canApprove, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  project: Partial<PortfolioProject>
  categoryOptions: string[]
  clients: Client[]
  canApprove: boolean
  onClose: () => void
  onSave: (data: PortfolioProject) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<PortfolioProject>({ ...emptyProject, ...project, gallery: project.gallery ?? [] })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState<Record<string, boolean>>({})

  const set = (k: keyof PortfolioProject, v: string | null) => setForm((f) => ({ ...f, [k]: v }))

  const gallery = form.gallery ?? []
  const setGallery = (next: PortfolioGalleryItem[]) => setForm((f) => ({ ...f, gallery: next }))

  const addGalleryItem = (type: 'image' | 'video') => {
    setGallery([...gallery, { id: newGalleryId(), type, url: '', caption: '' }])
  }
  const updateGalleryItem = (id: string, patch: Partial<PortfolioGalleryItem>) => {
    setGallery(gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }
  const removeGalleryItem = (id: string) => {
    setGallery(gallery.filter((g) => g.id !== id))
    setGalleryUploading((u) => { const next = { ...u }; delete next[id]; return next })
  }
  const anyGalleryUploading = Object.values(galleryUploading).some(Boolean)

  const handleClientLink = (id: string) => {
    const picked = clients.find((c) => c.id === id)
    setForm((f) => ({ ...f, clientId: id || null, client: picked ? picked.name : '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId) { onError('Pilih client terlebih dahulu'); return }
    if (gallery.some((g) => !g.url)) { onError('Lengkapi atau hapus item galeri yang masih kosong'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
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
            {mode === 'add' ? 'Tambah Portfolio' : 'Edit Portfolio'}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Slug *</label>
                <input className={inputCls} style={inputStyle} required value={form.slug}
                  placeholder="nippon-express"
                  onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Tahun</label>
                <input className={inputCls} style={inputStyle} value={form.year}
                  placeholder="2025"
                  onChange={(e) => set('year', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Judul Proyek *</label>
              <input className={inputCls} style={inputStyle} required value={form.title}
                placeholder="Nippon Express Global"
                onChange={(e) => set('title', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Kategori (Service)</label>
                <SearchSelect
                  value={form.category}
                  options={categoryOptions.map((c) => ({ value: c, label: c }))}
                  onChange={(v) => set('category', v)}
                  placeholder="Pilih Kategori"
                  clearLabel="Tanpa kategori"
                />
              </div>
              <div>
                <label style={labelStyle}>Client *</label>
                <SearchSelect
                  value={form.clientId ?? ''}
                  onChange={handleClientLink}
                  placeholder="Cari & pilih client..."
                  allowClear={false}
                  options={clients.map((c) => ({ value: c.id, label: c.name, icon: c.src }))}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status *</label>
              <SearchSelect
                value={form.status}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending', label: 'Menunggu Persetujuan' },
                  ...(canApprove || form.status === 'published' ? [{ value: 'published', label: 'Published' }] : []),
                ]}
                onChange={(v) => set('status', v as PortfolioStatus)}
                allowClear={false}
              />
            </div>
            <div>
              <label style={labelStyle}>Deskripsi Singkat *</label>
              <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} required
                value={form.description} placeholder="Deskripsi singkat proyek..."
                onChange={(e) => set('description', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Services Delivered</label>
              <input className={inputCls} style={inputStyle} value={form.services}
                placeholder="Video Production, Post-Production"
                onChange={(e) => set('services', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <MediaUploadField
              label="Foto Proyek" folder="portfolio"
              value={form.image} onChange={(url) => set('image', url)}
              onUploadingChange={setUploading} onError={onError}
            />

            <div style={{ paddingTop: 6, marginTop: 4, borderTop: `1px solid ${theme.divider}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 12px' }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: theme.textSecondary }}>Project Gallery (Foto & Video)</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => addGalleryItem('image')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add_photo_alternate</span>Foto
                  </button>
                  <button type="button" onClick={() => addGalleryItem('video')}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam</span>Video
                  </button>
                </div>
              </div>

              {gallery.length === 0 ? (
                <p style={{ fontSize: 11.5, color: theme.textMuted, padding: '8px 0' }}>Belum ada item galeri. Tambahkan foto atau link video (YouTube/Vimeo/Instagram/mp4).</p>
              ) : (
                <div className="space-y-3">
                  {gallery.map((g) => (
                    <div key={g.id} style={{ padding: 12, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{g.type === 'image' ? 'image' : 'movie'}</span>
                          {g.type === 'image' ? 'Foto' : 'Video'}
                        </span>
                        <button type="button" onClick={() => removeGalleryItem(g.id)}
                          style={{ padding: 5, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.danger }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                        </button>
                      </div>

                      {g.type === 'image' ? (
                        <MediaUploadField
                          label="" folder="portfolio-gallery" aspect="aspect-video"
                          value={g.url} onChange={(url) => updateGalleryItem(g.id, { url })}
                          onUploadingChange={(v) => setGalleryUploading((u) => ({ ...u, [g.id]: v }))}
                          onError={onError}
                        />
                      ) : (
                        <input className={inputCls} style={inputStyle} value={g.url}
                          placeholder="https://www.youtube.com/watch?v=... atau link mp4"
                          onChange={(e) => updateGalleryItem(g.id, { url: e.target.value })}
                          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                          onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                      )}
                      {g.type === 'video' && g.url && (
                        <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
                          Terdeteksi sebagai: {getVideoEmbed(g.url).kind}
                        </p>
                      )}
                      <input className={inputCls} style={{ ...inputStyle, marginTop: 8 }} value={g.caption ?? ''}
                        placeholder="Keterangan (opsional)"
                        onChange={(e) => updateGalleryItem(g.id, { caption: e.target.value })}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {([
              { key: 'challenge' as const, label: 'Tantangan' },
              { key: 'solution' as const, label: 'Solusi' },
              { key: 'result' as const, label: 'Hasil' },
            ]).map(({ key, label }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <textarea rows={3} className={inputCls} style={{ ...inputStyle, resize: 'none' }}
                  value={form[key] as string} placeholder={`Ceritakan ${label.toLowerCase()}...`}
                  onChange={(e) => set(key, e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${theme.divider}` }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.text }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary }}>
              Batal
            </button>
            <button type="submit" disabled={saving || uploading || anyGalleryUploading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || uploading || anyGalleryUploading) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || uploading || anyGalleryUploading) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
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

function SectionHeaderCard({ canEdit, showToast }: { canEdit: boolean; showToast: (type: ToastState['type'], message: string) => void }) {
  const { data, mutate } = useSWR('portfolioSection', siteContentService.getPortfolioSection)
  const [form, setForm] = useState<PortfolioSectionContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      await siteContentService.savePortfolioSection(form)
      await mutate(form, false)
      showToast('success', 'Judul & deskripsi section berhasil disimpan!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan judul & deskripsi section')
    } finally {
      setSaving(false)
    }
  }

  if (!form) return null

  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Judul & Deskripsi Section</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Teks "Recent Manifestations" yang tampil di homepage sebelum daftar portfolio</p>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.textMuted }}>{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${theme.divider}`, paddingTop: 16 }}>
            <div>
              <label style={labelStyle}>Judul</label>
              <input className={inputCls} style={inputStyle} value={form.heading}
                onChange={(e) => setForm({ ...form, heading: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Deskripsi</label>
              <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: `1px solid ${theme.divider}` }}>
            <button onClick={handleSave} disabled={saving || !canEdit}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || !canEdit) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || !canEdit) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const PORTFOLIO_STATUS_STYLES: Record<PortfolioStatus, { label: string; color: string; background: string }> = {
  draft: { label: 'Draft', color: theme.textSecondary, background: theme.surfaceSoft },
  pending: { label: 'Pending', color: '#b45309', background: '#fffbeb' },
  published: { label: 'Published', color: '#15803d', background: '#f0fdf4' },
}

export default function PortfolioPage() {
  const { edit, delete: canDelete, approve } = usePermission('portfolio')
  const { data: projects = [], isLoading: loading, mutate } = useSWR('portfolio', portfolioService.getAll)
  const { data: services = [] } = useSWR('services', servicesService.getAll)
  const { data: clients = [] } = useSWR('clients', clientsService.getAll)
  const categoryOptions = services.map((s) => s.navTitle).filter(Boolean)
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; project: Partial<PortfolioProject> } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | PortfolioStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const projectCategories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean))).sort()

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: PortfolioProject) => {
    try {
      await portfolioService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Portfolio berhasil ditambahkan!' : 'Portfolio berhasil diperbarui!')
      revalidatePaths(['/', '/portfolio', `/portfolio/${data.slug}`])
    } catch {
      showToast('error', 'Gagal menyimpan portfolio')
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm(`Hapus portfolio "${slug}"?`)) return
    setDeletingId(slug)
    try {
      await portfolioService.delete(slug)
      await mutate()
      showToast('success', 'Portfolio berhasil dihapus')
      revalidatePaths(['/', '/portfolio', `/portfolio/${slug}`])
    } catch {
      showToast('error', 'Gagal menghapus portfolio')
    } finally {
      setDeletingId(null)
    }
  }

  const setStatus = async (project: PortfolioProject, status: PortfolioStatus, message: string) => {
    try {
      await portfolioService.save({ ...project, status })
      await mutate()
      showToast('success', message)
      revalidatePaths(['/', '/portfolio', `/portfolio/${project.slug}`])
    } catch {
      showToast('error', 'Gagal memperbarui status portfolio')
    }
  }

  const handleApprove = (project: PortfolioProject) => setStatus(project, 'published', 'Portfolio berhasil disetujui & dipublikasikan')
  const handleReject = (project: PortfolioProject) => setStatus(project, 'draft', 'Portfolio dikembalikan ke draft')

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <PortfolioModal mode={modal.mode} project={modal.project} categoryOptions={categoryOptions} clients={clients} canApprove={approve}
          onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <SectionHeaderCard canEdit={edit} showToast={showToast} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0 order-1">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari portfolio..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 order-2 sm:order-3">
          {/* View toggle */}
          <div className="shrink-0" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setPage(1) }}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          {edit && (
            <button onClick={() => setModal({ mode: 'add', project: {} })}
              className="px-3 sm:px-4"
              style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 9, borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span><span className="hidden sm:inline">Tambah Proyek</span>
            </button>
          )}
        </div>

        {/* Status filter — full width on mobile so all tabs are visible without scrolling, inline on desktop */}
        <div className="overflow-x-auto w-full sm:w-auto sm:min-w-0 order-3 sm:order-2" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
          {([
            { key: 'all' as const, label: 'Semua' },
            { key: 'published' as const, label: 'Published' },
            { key: 'pending' as const, label: 'Pending' },
            { key: 'draft' as const, label: 'Draft' },
          ]).map((s) => (
            <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1) }}
              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 600, background: statusFilter === s.key ? theme.accentSoftHover : 'transparent', color: statusFilter === s.key ? theme.accentText : theme.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      {projectCategories.length > 0 && (
        <div className="overflow-x-auto mb-5" style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
          <button onClick={() => { setCategoryFilter('all'); setPage(1) }}
            style={{ padding: '6px 14px', borderRadius: 9999, border: `1px solid ${categoryFilter === 'all' ? theme.accent : theme.border}`, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 600, background: categoryFilter === 'all' ? theme.accentSoft : theme.surface, color: categoryFilter === 'all' ? theme.accentText : theme.textSecondary, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Semua Kategori
          </button>
          {projectCategories.map((c) => (
            <button key={c} title={c} onClick={() => { setCategoryFilter(c); setPage(1) }}
              style={{ padding: '6px 14px', borderRadius: 9999, border: `1px solid ${categoryFilter === c ? theme.accent : theme.border}`, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 600, background: categoryFilter === c ? theme.accentSoft : theme.surface, color: categoryFilter === c ? theme.accentText : theme.textSecondary, flexShrink: 0 }}>
              <span style={{ display: 'inline-block', maxWidth: 'min(160px, 42vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{c}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>photo_library</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada portfolio'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan proyek baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && edit && (
            <button onClick={() => setModal({ mode: 'add', project: {} })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Proyek
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((p, i) => (
            <div key={p.slug}
              className="rounded-2xl overflow-hidden group admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div className="aspect-video relative overflow-hidden" style={{ background: theme.surfaceSoft }}>
                {p.image
                  ? <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <MediaPlaceholder label="Tidak ada foto" />}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: PORTFOLIO_STATUS_STYLES[p.status].color, background: PORTFOLIO_STATUS_STYLES[p.status].background }}>
                    {PORTFOLIO_STATUS_STYLES[p.status].label}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 13.5, lineHeight: 1.35, flex: 1, fontFamily: theme.fontHeadline }}>{p.title}</h3>
                  <span style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}>{p.year || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {p.clientId && clientMap.get(p.clientId)?.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={clientMap.get(p.clientId)!.src} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 4 }} />
                  )}
                  <p style={{ fontSize: 11.5, color: theme.textSecondary }}>{p.client}</p>
                </div>
                <p style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.55 }} className="line-clamp-2">{p.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  {approve && p.status === 'pending' && (
                  <>
                  <button onClick={() => handleApprove(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: '#15803d', background: '#f0fdf4', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>Setujui
                  </button>
                  <button onClick={() => handleReject(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>Tolak
                  </button>
                  </>
                  )}
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', project: p })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(p.slug)} disabled={deletingId === p.slug}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === p.slug
                      ? <span className="w-3 h-3 border-2 rounded-full admin-spin" style={{ borderColor: 'rgba(220,38,38,0.25)', borderTopColor: theme.danger }} />
                      : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>}
                    Hapus
                  </button>
                  )}
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
                  {['#', 'Proyek', 'Client', 'Kategori', 'Tahun', 'Services', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.slug} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{p.title}</span>
                      <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>/{p.slug}</p>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.clientId && clientMap.get(p.clientId) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={clientMap.get(p.clientId)!.src} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 4 }} />
                        )}
                        {p.client}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {p.category
                        ? <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>{p.category}</span>
                        : <span style={{ fontSize: 12, color: theme.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{p.year || '—'}</td>
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 11 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.services}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: PORTFOLIO_STATUS_STYLES[p.status].color, background: PORTFOLIO_STATUS_STYLES[p.status].background }}>
                        {PORTFOLIO_STATUS_STYLES[p.status].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {approve && p.status === 'pending' && (
                        <>
                        <button onClick={() => handleApprove(p)} title="Setujui"
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#15803d'; b.style.background = '#f0fdf4' }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        </button>
                        <button onClick={() => handleReject(p)} title="Tolak"
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                        </button>
                        </>
                        )}
                        {edit && (
                        <button onClick={() => setModal({ mode: 'edit', project: p })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        )}
                        {canDelete && (
                        <button onClick={() => handleDelete(p.slug)} disabled={deletingId === p.slug}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === p.slug
                            ? <span className="w-4 h-4 border-2 rounded-full admin-spin block" style={{ borderColor: theme.divider, borderTopColor: theme.danger }} />
                            : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
                        </button>
                        )}
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
