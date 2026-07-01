'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { portfolioService, servicesService } from '@/lib/services'
import { PortfolioProject } from '@/data/portfolio'
import Image from 'next/image'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyProject: PortfolioProject = {
  slug: '', category: '', title: '', description: '', image: '/images/company.png',
  client: '', services: '', year: new Date().getFullYear().toString(),
  challenge: '', solution: '', result: '',
  prevSlug: null, nextSlug: null, nextLabel: null,
}

function PortfolioModal({
  mode, project, categoryOptions, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  project: Partial<PortfolioProject>
  categoryOptions: string[]
  onClose: () => void
  onSave: (data: PortfolioProject) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<PortfolioProject>({ ...emptyProject, ...project })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof PortfolioProject, v: string | null) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
                <label style={labelStyle}>Tahun *</label>
                <input className={inputCls} style={inputStyle} required value={form.year}
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
                <label style={labelStyle}>Kategori *</label>
                <select className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }} required value={form.category}
                  onChange={(e) => set('category', e.target.value)}>
                  <option value="">Pilih Kategori</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Client *</label>
                <input className={inputCls} style={inputStyle} required value={form.client}
                  placeholder="Nama klien"
                  onChange={(e) => set('client', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
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
              label="Foto Proyek" kind="image" folder="portfolio"
              value={form.image} onChange={(url) => set('image', url)}
              onUploadingChange={setUploading} onError={onError}
            />
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

export default function PortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; project: Partial<PortfolioProject> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const [portfolio, services] = await Promise.all([portfolioService.getAll(), servicesService.getAll()])
      setProjects(portfolio)
      setCategoryOptions(services.map((s) => s.navTitle).filter(Boolean))
    } catch {
      showToast('error', 'Gagal memuat portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleSave = async (data: PortfolioProject) => {
    try {
      await portfolioService.save(data)
      await fetchProjects()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Portfolio berhasil ditambahkan!' : 'Portfolio berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan portfolio')
    }
  }

  const handleDelete = async (slug: string) => {
    if (!confirm(`Hapus portfolio "${slug}"?`)) return
    setDeletingId(slug)
    try {
      await portfolioService.delete(slug)
      await fetchProjects()
      showToast('success', 'Portfolio berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus portfolio')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = projects.filter((p) => {
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
        <PortfolioModal mode={modal.mode} project={modal.project} categoryOptions={categoryOptions}
          onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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

        {/* View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
          {(['grid', 'table'] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setPage(1) }}
              style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setModal({ mode: 'add', project: {} })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Proyek
        </button>
      </div>

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
          {!search && (
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
                <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(16,24,40,0.55)', backdropFilter: 'blur(6px)' }}>
                    {p.category}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 13.5, lineHeight: 1.35, flex: 1, fontFamily: theme.fontHeadline }}>{p.title}</h3>
                  <span style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}>{p.year}</span>
                </div>
                <p style={{ fontSize: 11.5, color: theme.textSecondary, marginBottom: 8 }}>{p.client}</p>
                <p style={{ fontSize: 11, color: theme.textMuted, lineHeight: 1.55 }} className="line-clamp-2">{p.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  <button onClick={() => setModal({ mode: 'edit', project: p })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  <button onClick={() => handleDelete(p.slug)} disabled={deletingId === p.slug}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === p.slug
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
                  {['#', 'Proyek', 'Client', 'Kategori', 'Tahun', 'Services', ''].map((h) => (
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
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{p.client}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{p.year}</td>
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 11 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.services}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setModal({ mode: 'edit', project: p })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(p.slug)} disabled={deletingId === p.slug}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === p.slug
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
