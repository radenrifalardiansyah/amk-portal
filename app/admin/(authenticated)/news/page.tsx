'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { newsService, newsCategoriesService, siteContentService } from '@/lib/services'
import type { NewsArticle, NewsStatus, NewsSectionContent } from '@/lib/services'
import MediaCoverThumb from '@/components/MediaCoverThumb'
import VideoCoverThumb from '@/components/VideoCoverThumb'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import SearchSelect from '@/components/admin/SearchSelect'
import { getVideoEmbed } from '@/lib/videoEmbed'
import { useMediaTypeDrafts } from '@/lib/useMediaTypeDrafts'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'
import { formatPublishedAt } from '@/lib/services/newsService'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const todayISO = () => new Date().toISOString().slice(0, 10)
const nowHHMM = () => new Date().toTimeString().slice(0, 5)

const emptyArticle: NewsArticle = {
  slug: '', title: '', excerpt: '', content: '', coverImage: '/images/company.png', imageType: 'image',
  category: '', author: '', status: 'draft', publishedAt: todayISO(), publishedTime: nowHHMM(), tags: '',
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function formatDate(article: NewsArticle) {
  if (!article.publishedAt) return '—'
  return formatPublishedAt(article, { weekday: false, month: 'short' })
}

function NewsModal({
  mode, article, categoryOptions, canApprove, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  article: Partial<NewsArticle>
  categoryOptions: string[]
  canApprove: boolean
  onClose: () => void
  onSave: (data: NewsArticle) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<NewsArticle>({ ...emptyArticle, ...article })
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const switchImageType = useMediaTypeDrafts(form.imageType, form.coverImage)

  const set = <K extends keyof NewsArticle>(k: K, v: NewsArticle[K]) => setForm((f) => ({ ...f, [k]: v }))

  const handleTitleChange = (value: string) => {
    set('title', value)
    if (!slugTouched) set('slug', slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.coverImage) { onError(form.imageType === 'video' ? 'Link video cover wajib diisi' : 'Cover berita wajib diunggah'); return }
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
            {mode === 'add' ? 'Tambah Berita' : 'Edit Berita'}
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
              <label style={labelStyle}>Judul Berita *</label>
              <input className={inputCls} style={inputStyle} required value={form.title}
                placeholder="AMK Raih Penghargaan Agensi Kreatif 2025"
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input className={inputCls} style={inputStyle} required value={form.slug}
                placeholder="amk-raih-penghargaan-2025"
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Kategori</label>
                <SearchSelect
                  value={form.category}
                  options={categoryOptions.map((c) => ({ value: c, label: c }))}
                  onChange={(v) => set('category', v)}
                  clearLabel="Tanpa kategori"
                  placeholder="Cari & pilih kategori..."
                />
              </div>
              <div>
                <label style={labelStyle}>Penulis *</label>
                <input className={inputCls} style={inputStyle} required value={form.author}
                  placeholder="Tim AMK"
                  onChange={(e) => set('author', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Tanggal Publikasi *</label>
                <input type="date" className={inputCls} style={inputStyle} required value={form.publishedAt}
                  onChange={(e) => set('publishedAt', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Jam Publikasi *</label>
                <input type="time" className={inputCls} style={inputStyle} required value={form.publishedTime}
                  onChange={(e) => set('publishedTime', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
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
                  onChange={(v) => set('status', v as NewsStatus)}
                  allowClear={false}
                />
              </div>
            </div>
            <p style={{ fontSize: 11, color: theme.textMuted, marginTop: -8 }}>
              Berita baru tampil di website setelah tanggal &amp; jam ini tiba (waktu WIB).
            </p>
            <div>
              <label style={labelStyle}>Ringkasan Singkat *</label>
              <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} required
                value={form.excerpt} placeholder="Ringkasan singkat yang tampil di daftar berita..."
                onChange={(e) => set('excerpt', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Cover Berita *</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {(['image', 'video'] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((f) => ({ ...f, imageType: t, coverImage: switchImageType(t) }))}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${(form.imageType ?? 'image') === t ? theme.accent : theme.border}`,
                      background: (form.imageType ?? 'image') === t ? theme.accentSoft : theme.surfaceSoft,
                      color: (form.imageType ?? 'image') === t ? theme.accentText : theme.textSecondary,
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t === 'image' ? 'image' : 'movie'}</span>
                    {t === 'image' ? 'Foto' : 'Video'}
                  </button>
                ))}
              </div>

              {(form.imageType ?? 'image') === 'image' ? (
                <MediaUploadField
                  label="" folder="news"
                  recommendedWidth={1280} recommendedHeight={720} cropToAspect
                  value={form.coverImage} onChange={(url) => set('coverImage', url)}
                  onUploadingChange={setUploading} onError={onError}
                />
              ) : (
                <>
                  <input className={inputCls} style={inputStyle} value={form.coverImage}
                    placeholder="https://www.youtube.com/watch?v=... atau link mp4"
                    onChange={(e) => set('coverImage', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  {form.coverImage && (
                    <>
                      <div className="aspect-video relative w-full overflow-hidden rounded-xl mt-2" style={{ background: theme.surfaceSoft }}>
                        <VideoCoverThumb url={form.coverImage} alt="Cover Berita" />
                      </div>
                      <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 5 }}>
                        Terdeteksi sebagai: {getVideoEmbed(form.coverImage).kind}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
            <div>
              <label style={labelStyle}>Isi Berita *</label>
              <textarea rows={10} className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} required
                value={form.content} placeholder={'Tulis isi berita di sini. Pisahkan paragraf dengan baris kosong.'}
                onChange={(e) => set('content', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Tags (pisahkan dengan koma)</label>
              <input className={inputCls} style={inputStyle} value={form.tags}
                placeholder="penghargaan, prestasi, agensi kreatif"
                onChange={(e) => set('tags', e.target.value)}
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

function SectionHeaderCard({
  canEdit, showToast, swrKey, getContent, saveContent, title, subtitle, revalidate,
}: {
  canEdit: boolean
  showToast: (type: ToastState['type'], message: string) => void
  swrKey: string
  getContent: () => Promise<NewsSectionContent>
  saveContent: (data: NewsSectionContent) => Promise<void>
  title: string
  subtitle: string
  revalidate: string[]
}) {
  const { data, mutate } = useSWR(swrKey, getContent)
  const [form, setForm] = useState<NewsSectionContent | null>(null)
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
      await saveContent(form)
      await mutate(form, false)
      showToast('success', 'Judul & deskripsi berhasil disimpan!')
      revalidatePaths(revalidate)
    } catch {
      showToast('error', 'Gagal menyimpan judul & deskripsi')
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
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>{title}</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{subtitle}</p>
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || !canEdit) ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: (saving || !canEdit) ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
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

const NEWS_STATUS_STYLES: Record<NewsStatus, { label: string; color: string; background: string }> = {
  draft: { label: 'Draft', color: theme.textSecondary, background: theme.surfaceSoft },
  pending: { label: 'Pending', color: '#b45309', background: '#fffbeb' },
  published: { label: 'Published', color: '#15803d', background: '#f0fdf4' },
}

export default function NewsPage() {
  const { edit, delete: canDelete, approve } = usePermission('news')
  const { data: articles = [], isLoading: loading, mutate } = useSWR('news', newsService.getAll)
  const { data: categories = [] } = useSWR('news-categories', newsCategoriesService.getAll)
  const categoryOptions = categories.map((c) => c.name)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; article: Partial<NewsArticle> } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | NewsStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const articleCategories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean))).sort()

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const notifyRevalidateFailure = () => {
    setTimeout(() => showToast('info', 'Tersimpan, tapi cache halaman live gagal di-refresh. Perubahan akan tampil otomatis dalam ±5 menit.'), 4200)
  }

  const handleSave = async (data: NewsArticle) => {
    try {
      await newsService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Berita berhasil ditambahkan!' : 'Berita berhasil diperbarui!')
      const revalidated = await revalidatePaths(['/', '/news', `/news/${data.slug}`, '/sitemap.xml'])
      if (!revalidated) notifyRevalidateFailure()
    } catch {
      showToast('error', 'Gagal menyimpan berita')
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm(`Hapus berita "${slug}"?`)) return
    setDeletingId(slug)
    try {
      await newsService.delete(slug)
      await mutate()
      showToast('success', 'Berita berhasil dihapus')
      const revalidated = await revalidatePaths(['/', '/news', `/news/${slug}`, '/sitemap.xml'])
      if (!revalidated) notifyRevalidateFailure()
    } catch {
      showToast('error', 'Gagal menghapus berita')
    } finally {
      setDeletingId(null)
    }
  }

  const setStatus = async (article: NewsArticle, status: NewsStatus, message: string) => {
    try {
      await newsService.save({ ...article, status })
      await mutate()
      showToast('success', message)
      const revalidated = await revalidatePaths(['/', '/news', `/news/${article.slug}`, '/sitemap.xml'])
      if (!revalidated) notifyRevalidateFailure()
    } catch {
      showToast('error', 'Gagal memperbarui status berita')
    }
  }

  const handleApprove = (article: NewsArticle) => setStatus(article, 'published', 'Berita berhasil disetujui & dipublikasikan')
  const handleReject = (article: NewsArticle) => setStatus(article, 'draft', 'Berita dikembalikan ke draft')

  const filtered = articles.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.author.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <NewsModal mode={modal.mode} article={modal.article} categoryOptions={categoryOptions} canApprove={approve}
          onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <SectionHeaderCard canEdit={edit} showToast={showToast}
        swrKey="newsSection" getContent={siteContentService.getNewsSection} saveContent={siteContentService.saveNewsSection}
        title="Judul & Deskripsi Section (Homepage)" subtitle='Teks "Berita" yang tampil di homepage sebelum daftar berita'
        revalidate={['/']} />
      <SectionHeaderCard canEdit={edit} showToast={showToast}
        swrKey="newsPage" getContent={siteContentService.getNewsPage} saveContent={siteContentService.saveNewsPage}
        title="Judul & Deskripsi Halaman /news" subtitle="Teks hero yang tampil di halaman /news (daftar lengkap berita)"
        revalidate={['/news']} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0 order-1">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari berita..." value={search}
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
          <button onClick={() => setModal({ mode: 'add', article: {} })}
            className="px-3 sm:px-4"
            style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 9, borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(7,82,183,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span><span className="hidden sm:inline">Tambah Berita</span>
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
      {articleCategories.length > 0 && (
        <div className="overflow-x-auto mb-5" style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
          <button onClick={() => { setCategoryFilter('all'); setPage(1) }}
            style={{ padding: '6px 14px', borderRadius: 9999, border: `1px solid ${categoryFilter === 'all' ? theme.accent : theme.border}`, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, fontWeight: 600, background: categoryFilter === 'all' ? theme.accentSoft : theme.surface, color: categoryFilter === 'all' ? theme.accentText : theme.textSecondary, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Semua Kategori
          </button>
          {articleCategories.map((c) => (
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
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat berita...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>newspaper</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada berita'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan berita baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && edit && (
            <button onClick={() => setModal({ mode: 'add', article: {} })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(7,82,183,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Berita
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((a, i) => (
            <div key={a.slug}
              className="rounded-2xl overflow-hidden group admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div className="aspect-video relative overflow-hidden" style={{ background: theme.surfaceSoft }}>
                <MediaCoverThumb image={a.coverImage} imageType={a.imageType} alt={a.title} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: NEWS_STATUS_STYLES[a.status].color, background: NEWS_STATUS_STYLES[a.status].background }}>
                    {NEWS_STATUS_STYLES[a.status].label}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 13.5, lineHeight: 1.35, flex: 1, fontFamily: theme.fontHeadline }} className="line-clamp-2">{a.title}</h3>
                </div>
                <p style={{ fontSize: 11.5, color: theme.textSecondary, marginBottom: 8 }}>{a.author} &middot; {formatDate(a)}</p>
                <p style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.55 }} className="line-clamp-2">{a.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  {approve && a.status === 'pending' && (
                  <>
                  <button onClick={() => handleApprove(a)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: '#15803d', background: '#f0fdf4', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>Setujui
                  </button>
                  <button onClick={() => handleReject(a)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>Tolak
                  </button>
                  </>
                  )}
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', article: a })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(a.slug)} disabled={deletingId === a.slug}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === a.slug
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
                  {['#', 'Judul', 'Kategori', 'Penulis', 'Tanggal', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.slug} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 600, color: theme.text, fontSize: 13 }}>{a.title}</span>
                      <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>/news/{a.slug}</p>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {a.category
                        ? <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>{a.category}</span>
                        : <span style={{ fontSize: 12, color: theme.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{a.author}</td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{formatDate(a)}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: NEWS_STATUS_STYLES[a.status].color, background: NEWS_STATUS_STYLES[a.status].background }}>
                        {NEWS_STATUS_STYLES[a.status].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {approve && a.status === 'pending' && (
                        <>
                        <button onClick={() => handleApprove(a)} title="Setujui"
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#15803d'; b.style.background = '#f0fdf4' }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        </button>
                        <button onClick={() => handleReject(a)} title="Tolak"
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                        </button>
                        </>
                        )}
                        {edit && (
                        <button onClick={() => setModal({ mode: 'edit', article: a })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        )}
                        {canDelete && (
                        <button onClick={() => handleDelete(a.slug)} disabled={deletingId === a.slug}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === a.slug
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
