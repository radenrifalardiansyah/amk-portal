'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import IconPickerField from '@/components/admin/IconPickerField'
import { leadersService, keyPartnersService, siteContentService } from '@/lib/services'
import type { Leader, KeyPartner, KeyPartnerMember, TeamsSectionContent } from '@/lib/services'
import Image from 'next/image'
import MediaPlaceholder from '@/components/MediaPlaceholder'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import AvatarPicker from '@/components/admin/AvatarPicker'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function TeamsSectionHeaderCard({ variant, canEdit, showToast }: {
  variant: 'leadership' | 'partners'
  canEdit: boolean
  showToast: (type: ToastState['type'], message: string) => void
}) {
  const { data, mutate } = useSWR('teamsSection', siteContentService.getTeamsSection)
  const [form, setForm] = useState<TeamsSectionContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data, form])

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

  const headingKey = variant === 'leadership' ? 'heading' : 'partnersHeading'
  const descriptionKey = variant === 'leadership' ? 'description' : 'partnersDescription'
  const title = variant === 'leadership' ? 'Judul & Deskripsi Section' : 'Judul & Deskripsi Key Partners'
  const subtitle = variant === 'leadership'
    ? 'Teks "Teams" yang tampil di homepage sebelum daftar leadership'
    : 'Teks "Key Partners" yang tampil di homepage sebelum daftar key partner'

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      await siteContentService.saveTeamsSection(form)
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
              <input className={inputCls} style={inputStyle} value={form[headingKey]}
                onChange={(e) => setForm({ ...form, [headingKey]: e.target.value })}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Deskripsi</label>
              <textarea rows={2} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form[descriptionKey]}
                onChange={(e) => setForm({ ...form, [descriptionKey]: e.target.value })}
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

const emptyLeader: Leader = {
  id: '', name: '', role: '', image: '/images/company.png', order: 1,
  bio: '', email: '', phone: '', linkedin: '', instagram: '',
}

function LeaderModal({
  mode, leader, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  leader: Partial<Leader>
  onClose: () => void
  onSave: (data: Leader) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<Leader>({ ...emptyLeader, ...leader })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof Leader, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

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
            {mode === 'add' ? 'Tambah Leader' : 'Edit Leader'}
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
                <label style={labelStyle}>Nama *</label>
                <input className={inputCls} style={inputStyle} required value={form.name}
                  placeholder="Rizqi Maulana"
                  onChange={(e) => set('name', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Jabatan *</label>
                <input className={inputCls} style={inputStyle} required value={form.role}
                  placeholder="Leading Director"
                  onChange={(e) => set('role', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>
            <MediaUploadField
              label="Foto" folder="leadership" aspect="aspect-[3/4]"
              value={form.image} onChange={(url) => set('image', url)}
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
              <p style={{ fontSize: 11.5, fontWeight: 700, color: theme.textSecondary, margin: '14px 0 12px' }}>Detail Data Pribadi</p>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Bio / Deskripsi Singkat</label>
                  <textarea rows={3} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={form.bio}
                    placeholder="Latar belakang, pengalaman, atau pencapaian singkat..."
                    onChange={(e) => set('bio', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" className={inputCls} style={inputStyle} value={form.email}
                      placeholder="nama@amkgroup.co.id"
                      onChange={(e) => set('email', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                  <div>
                    <label style={labelStyle}>No. Telepon</label>
                    <input className={inputCls} style={inputStyle} value={form.phone}
                      placeholder="+62 812-3456-7890"
                      onChange={(e) => set('phone', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>LinkedIn</label>
                    <input className={inputCls} style={inputStyle} value={form.linkedin}
                      placeholder="linkedin.com/in/username"
                      onChange={(e) => set('linkedin', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Instagram</label>
                    <input className={inputCls} style={inputStyle} value={form.instagram}
                      placeholder="@username"
                      onChange={(e) => set('instagram', e.target.value)}
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

function LeadershipTab({ edit, canDelete }: { edit: boolean; canDelete: boolean }) {
  const { data: leaders = [], isLoading: loading, mutate } = useSWR('leaders', leadersService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; leader: Partial<Leader> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: Leader) => {
    try {
      await leadersService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Leader berhasil ditambahkan!' : 'Leader berhasil diperbarui!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan leader')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus leader "${name}"?`)) return
    setDeletingId(id)
    try {
      await leadersService.delete(id)
      await mutate()
      showToast('success', 'Leader berhasil dihapus')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menghapus leader')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = leaders.length ? Math.max(...leaders.map((l) => l.order)) + 1 : 1

  const filtered = leaders.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <LeaderModal mode={modal.mode} leader={modal.leader} onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <TeamsSectionHeaderCard variant="leadership" canEdit={edit} showToast={showToast} />

      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari leader..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setPage(1) }}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          {edit && (
          <button onClick={() => setModal({ mode: 'add', leader: { order: nextOrder } })}
            className="px-3 sm:px-4"
            style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 9, borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span><span className="hidden sm:inline">Tambah Leader</span>
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat leadership...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>groups</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada leader'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan leader baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && edit && (
            <button onClick={() => setModal({ mode: 'add', leader: { order: nextOrder } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Leader
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((l, i) => (
            <div key={l.id}
              className="rounded-2xl overflow-hidden group admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div className="aspect-[3/4] relative overflow-hidden" style={{ background: theme.surfaceSoft }}>
                {l.image
                  ? <Image src={l.image} alt={l.name} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <MediaPlaceholder label="Tidak ada foto" />}
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(16,24,40,0.55)', backdropFilter: 'blur(6px)' }}>
                    #{l.order}
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 13.5, lineHeight: 1.35, marginBottom: 4, fontFamily: theme.fontHeadline }}>{l.name}</h3>
                <p style={{ fontSize: 11.5, color: theme.textSecondary }}>{l.role}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', leader: l })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(l.id, l.name)} disabled={deletingId === l.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === l.id
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
                  {['#', 'Foto', 'Nama', 'Jabatan', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ width: 40, height: 40, position: 'relative', borderRadius: 10, overflow: 'hidden', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                        {l.image
                          ? <Image src={l.image} alt={l.name} fill sizes="40px" className="object-cover" />
                          : <MediaPlaceholder icon="person" size="sm" />}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{l.name}</td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>{l.role}</td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{l.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {edit && (
                        <button onClick={() => setModal({ mode: 'edit', leader: l })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        )}
                        {canDelete && (
                        <button onClick={() => handleDelete(l.id, l.name)} disabled={deletingId === l.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === l.id
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

const emptyKeyPartner: KeyPartner = { id: '', icon: 'diversity_3', category: '', members: [], order: 1 }
const MEMBER_PAGE_SIZE = 4

function KeyPartnerModal({
  mode, partner, onClose, onSave, onError,
}: {
  mode: 'add' | 'edit'
  partner: Partial<KeyPartner>
  onClose: () => void
  onSave: (data: KeyPartner) => void
  onError: (message: string) => void
}) {
  const [form, setForm] = useState<KeyPartner>({ ...emptyKeyPartner, ...partner })
  const [saving, setSaving] = useState(false)
  const [memberPage, setMemberPage] = useState(1)

  const set = (k: keyof KeyPartner, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: slugify(form.category) } : form
    await onSave(data)
    setSaving(false)
  }

  const addMember = () => {
    const members = [...form.members, { name: '', role: '' }]
    setForm({ ...form, members })
    setMemberPage(Math.ceil(members.length / MEMBER_PAGE_SIZE))
  }

  const removeMember = (i: number) => {
    const members = form.members.filter((_, idx) => idx !== i)
    setForm({ ...form, members })
    setMemberPage((p) => Math.min(p, Math.max(1, Math.ceil(members.length / MEMBER_PAGE_SIZE))))
  }

  const updateMember = (i: number, patch: Partial<KeyPartnerMember>) => {
    setForm((f) => {
      const members = [...f.members]
      members[i] = { ...members[i], ...patch }
      return { ...f, members }
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
            {mode === 'add' ? 'Tambah Key Partner' : 'Edit Key Partner'}
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
              <IconPickerField
                label="Icon (Material Symbol) *"
                value={form.icon}
                placeholder="diversity_3"
                onChange={(icon) => set('icon', icon)}
              />
            </div>
            <div>
              <label style={labelStyle}>Kategori *</label>
              <input className={inputCls} style={inputStyle} required value={form.category}
                placeholder="Visual & Cinematic Directors"
                onChange={(e) => set('category', e.target.value)}
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

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Anggota / Partner</label>
                <button type="button" onClick={addMember}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>Tambah Anggota
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.members
                  .map((m, idx) => ({ m, idx }))
                  .slice((memberPage - 1) * MEMBER_PAGE_SIZE, memberPage * MEMBER_PAGE_SIZE)
                  .map(({ m, idx }) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <AvatarPicker
                        value={m.photo}
                        onChange={(url) => updateMember(idx, { photo: url })}
                        fallback={m.name || '?'}
                        size={44}
                        onError={onError}
                      />
                      <div className="grid grid-cols-2 gap-2" style={{ flex: 1, minWidth: 0 }}>
                        <div>
                          <label style={{ ...labelStyle, fontSize: 9, marginBottom: 4 }}>Nama *</label>
                          <input
                            style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...inputStyle }}
                            value={m.name}
                            placeholder="Nama partner"
                            onChange={(e) => updateMember(idx, { name: e.target.value })}
                            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                          />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: 9, marginBottom: 4 }}>Peran / Detail</label>
                          <input
                            style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...inputStyle }}
                            value={m.role || ''}
                            placeholder="cth. Web Designer & Developer"
                            onChange={(e) => updateMember(idx, { role: e.target.value })}
                            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 9, marginBottom: 4 }}>Instagram</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          style={{ flex: 1, minWidth: 0, padding: '6px 10px', fontSize: 13, borderRadius: 8, outline: 'none', boxSizing: 'border-box', ...inputStyle }}
                          value={m.instagram || ''}
                          placeholder="@username atau instagram.com/username"
                          onChange={(e) => updateMember(idx, { instagram: e.target.value })}
                          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                          onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                        />
                        <button type="button" onClick={() => removeMember(idx)}
                          style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', flexShrink: 0 }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.danger }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {form.members.length === 0 && (
                  <p style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', padding: '12px 0' }}>Belum ada anggota</p>
                )}
                <Pagination page={memberPage} pageSize={MEMBER_PAGE_SIZE} totalItems={form.members.length} onPageChange={setMemberPage} />
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
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: saving ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
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

function KeyPartnersTab({ edit, canDelete }: { edit: boolean; canDelete: boolean }) {
  const { data: partners = [], isLoading: loading, mutate } = useSWR('keyPartners', keyPartnersService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; partner: Partial<KeyPartner> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: KeyPartner) => {
    try {
      await keyPartnersService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Key partner berhasil ditambahkan!' : 'Key partner berhasil diperbarui!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan key partner')
    }
  }

  const handleDelete = async (id: string, category: string) => {
    if (!confirm(`Hapus key partner "${category}"?`)) return
    setDeletingId(id)
    try {
      await keyPartnersService.delete(id)
      await mutate()
      showToast('success', 'Key partner berhasil dihapus')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menghapus key partner')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = partners.length ? Math.max(...partners.map((p) => p.order)) + 1 : 1

  const filtered = partners.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.category.toLowerCase().includes(q)
      || p.members.some((m) => m.name.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q))
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <KeyPartnerModal mode={modal.mode} partner={modal.partner} onClose={() => setModal(null)} onSave={handleSave}
          onError={(msg) => showToast('error', msg)} />
      )}

      <TeamsSectionHeaderCard variant="partners" canEdit={edit} showToast={showToast} />

      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari key partner..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setPage(1) }}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          {edit && (
          <button onClick={() => setModal({ mode: 'add', partner: { order: nextOrder } })}
            className="px-3 sm:px-4"
            style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 9, borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span><span className="hidden sm:inline">Tambah Key Partner</span>
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat key partners...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>diversity_3</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada key partner'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan key partner baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && edit && (
            <button onClick={() => setModal({ mode: 'add', partner: { order: nextOrder } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Key Partner
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((p, i) => (
            <div key={p.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.accent }}>{p.icon}</span>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.surfaceSoft, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                    #{p.order}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 4, lineHeight: 1.3, fontFamily: theme.fontHeadline, fontSize: 14 }}>{p.category}</h3>
                <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>{p.members.length} anggota</p>
                <p style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.55, marginBottom: 14 }} className="line-clamp-3">
                  {p.members.map((m) => (m.role ? `${m.name} (${m.role})` : m.name)).join(', ') || 'Belum ada anggota'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  {edit && (
                  <button onClick={() => setModal({ mode: 'edit', partner: p })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  )}
                  {canDelete && (
                  <button onClick={() => handleDelete(p.id, p.category)} disabled={deletingId === p.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === p.id
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
                  {['#', 'Icon', 'Kategori', 'Anggota', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.accent }}>{p.icon}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{p.category}</td>
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 11.5 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {p.members.map((m) => m.name).join(', ') || `${p.members.length} anggota`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{p.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {edit && (
                        <button onClick={() => setModal({ mode: 'edit', partner: p })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        )}
                        {canDelete && (
                        <button onClick={() => handleDelete(p.id, p.category)} disabled={deletingId === p.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === p.id
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

const TABS = [
  { key: 'leadership', label: 'Leadership', icon: 'groups' },
  { key: 'key-partners', label: 'Key Partners', icon: 'diversity_3' },
] as const

export default function TeamsPage() {
  const { edit, delete: canDelete } = usePermission('teams')
  const [tab, setTab] = useState<typeof TABS[number]['key']>('leadership')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, width: 'fit-content', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontWeight: 600, background: tab === t.key ? theme.accentSoftHover : 'transparent', color: tab === t.key ? theme.accentText : theme.textMuted }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'leadership' ? <LeadershipTab edit={edit} canDelete={canDelete} /> : <KeyPartnersTab edit={edit} canDelete={canDelete} />}
    </>
  )
}
