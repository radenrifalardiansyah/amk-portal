'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { clientsService, siteContentService } from '@/lib/services'
import type { Client, ClientsSectionContent } from '@/lib/services'
import Image from 'next/image'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyClient: Client = {
  id: '', name: '', src: '/images/company.png', order: 1,
  industry: '', website: '', address: '', description: '',
  picName: '', picRole: '', picEmail: '', picPhone: '',
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function ClientModal({
  mode, client, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  client: Partial<Client>
  onClose: () => void
  onSave: (data: Client) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<Client>({ ...emptyClient, ...client })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof Client, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: slugify(form.name) } : form
    await onSave(data)
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
            {mode === 'add' ? 'Tambah Client' : 'Edit Client'}
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
              <label style={labelStyle}>Nama Klien *</label>
              <input className={inputCls} style={inputStyle} required value={form.name}
                placeholder="Nippon Express"
                onChange={(e) => set('name', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <MediaUploadField
              label="Logo Klien" folder="clients" aspect="aspect-[4/3]"
              value={form.src} onChange={(url) => set('src', url)}
              onUploadingChange={setUploading} onError={onError}
            />
            <div>
              <label style={labelStyle}>Urutan *</label>
              <input type="number" className={inputCls} style={inputStyle} required value={form.order}
                onChange={(e) => set('order', Number(e.target.value))}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>

            <div style={{ paddingTop: 6, marginTop: 4, borderTop: `1px solid ${theme.divider}` }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: theme.textSecondary, margin: '14px 0 12px' }}>Profil Perusahaan</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Industri</label>
                    <input className={inputCls} style={inputStyle} value={form.industry}
                      placeholder="Logistik, Pemerintahan, dll."
                      onChange={(e) => set('industry', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input className={inputCls} style={inputStyle} value={form.website}
                      placeholder="https://www.namaklien.com"
                      onChange={(e) => set('website', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Alamat</label>
                  <input className={inputCls} style={inputStyle} value={form.address}
                    placeholder="Alamat kantor klien"
                    onChange={(e) => set('address', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                </div>
                <div>
                  <label style={labelStyle}>Deskripsi Perusahaan</label>
                  <textarea rows={3} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.description}
                    placeholder="Deskripsi singkat mengenai perusahaan klien..."
                    onChange={(e) => set('description', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 6, marginTop: 4, borderTop: `1px solid ${theme.divider}` }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: theme.textSecondary, margin: '14px 0 12px' }}>Kontak PIC</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Nama PIC</label>
                    <input className={inputCls} style={inputStyle} value={form.picName}
                      placeholder="Nama penanggung jawab"
                      onChange={(e) => set('picName', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Jabatan PIC</label>
                    <input className={inputCls} style={inputStyle} value={form.picRole}
                      placeholder="Marketing Manager"
                      onChange={(e) => set('picRole', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Email PIC</label>
                    <input type="email" className={inputCls} style={inputStyle} value={form.picEmail}
                      placeholder="nama@perusahaanklien.com"
                      onChange={(e) => set('picEmail', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                  <div>
                    <label style={labelStyle}>No. Telepon PIC</label>
                    <input className={inputCls} style={inputStyle} value={form.picPhone}
                      placeholder="+62 812-3456-7890"
                      onChange={(e) => set('picPhone', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                </div>
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

function SectionHeaderCard({ canEdit, showToast }: { canEdit: boolean; showToast: (type: ToastState['type'], message: string) => void }) {
  const { data, mutate } = useSWR('clientsSection', siteContentService.getClientsSection)
  const [form, setForm] = useState<ClientsSectionContent | null>(null)
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
      await siteContentService.saveClientsSection(form)
      await mutate(form, false)
      showToast('success', 'Judul section berhasil disimpan!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan judul section')
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
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Judul Section</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Teks "Our Clients" yang tampil di homepage sebelum daftar logo client</p>
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

export default function ClientsPage() {
  const { edit, delete: canDelete } = usePermission('clients')
  const { data: clients = [], isLoading: loading, mutate } = useSWR('clients', clientsService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; client: Partial<Client> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: Client) => {
    try {
      await clientsService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Client berhasil ditambahkan!' : 'Client berhasil diperbarui!')
      revalidatePaths(['/', '/portfolio'])
    } catch {
      showToast('error', 'Gagal menyimpan client')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus client "${name}"?`)) return
    setDeletingId(id)
    try {
      await clientsService.delete(id)
      await mutate()
      showToast('success', 'Client berhasil dihapus')
      revalidatePaths(['/', '/portfolio'])
    } catch {
      showToast('error', 'Gagal menghapus client')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = clients.length ? Math.max(...clients.map((c) => c.order)) + 1 : 1

  const filtered = clients.filter((c) => {
    if (!search) return true
    return c.name.toLowerCase().includes(search.toLowerCase())
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <ClientModal mode={modal.mode} client={modal.client} onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <SectionHeaderCard canEdit={edit} showToast={showToast} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari client..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* View toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setPage(1) }}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          {edit && (
          <button onClick={() => setModal({ mode: 'add', client: { order: nextOrder } })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Client
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat clients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>business</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada client'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan client baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && edit && (
            <button onClick={() => setModal({ mode: 'add', client: { order: nextOrder } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Client
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((c, i) => (
            <div key={c.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div className="aspect-[4/3] relative overflow-hidden" style={{ background: theme.surfaceSoft }}>
                <Image src={c.src} alt={c.name} fill className="object-contain p-6" />
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 7, fontSize: 10.5, fontWeight: 600, color: theme.textMuted, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', border: `1px solid ${theme.border}` }}>
                    #{c.order}
                  </span>
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontWeight: 600, color: theme.text, fontSize: 12, lineHeight: 1.35, marginBottom: 10 }} className="line-clamp-1">{c.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', client: c })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(c.id, c.name)} disabled={deletingId === c.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === c.id
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
        <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
        </>
      ) : (
        <>
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['#', 'Logo', 'Nama', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ width: 44, height: 44, position: 'relative', borderRadius: 8, overflow: 'hidden', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                        <Image src={c.src} alt={c.name} fill className="object-contain p-1.5" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{c.name}</td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{c.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {edit && (
                        <button onClick={() => setModal({ mode: 'edit', client: c })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        )}
                        {canDelete && (
                        <button onClick={() => handleDelete(c.id, c.name)} disabled={deletingId === c.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === c.id
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
