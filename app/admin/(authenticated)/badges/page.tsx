'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { badgesService } from '@/lib/services'
import type { Badge } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyBadge: Badge = { id: '', name: '', order: 1 }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function BadgeModal({
  mode, badge, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  badge: Partial<Badge>
  onClose: () => void
  onSave: (data: Badge) => void
}) {
  const [form, setForm] = useState<Badge>({ ...emptyBadge, ...badge })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof Badge, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

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
      <div className="w-full max-w-md admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Badge' : 'Edit Badge'}
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
              <label style={labelStyle}>Nama Badge *</label>
              <input className={inputCls} style={inputStyle} required value={form.name}
                placeholder="Core Pillar"
                onChange={(e) => set('name', e.target.value)}
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

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; badge: Partial<Badge> } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchBadges = useCallback(async () => {
    setLoading(true)
    try {
      setBadges(await badgesService.getAll())
    } catch {
      showToast('error', 'Gagal memuat badges')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBadges() }, [fetchBadges])

  const handleSave = async (data: Badge) => {
    try {
      await badgesService.save(data)
      await fetchBadges()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Badge berhasil ditambahkan!' : 'Badge berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan badge')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus badge "${name}"?`)) return
    setDeletingId(id)
    try {
      await badgesService.delete(id)
      await fetchBadges()
      showToast('success', 'Badge berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus badge')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = badges.length ? Math.max(...badges.map((b) => b.order)) + 1 : 1

  const filtered = badges.filter((b) => {
    if (!search) return true
    return b.name.toLowerCase().includes(search.toLowerCase())
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <BadgeModal mode={modal.mode} badge={modal.badge} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari badge..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <button onClick={() => setModal({ mode: 'add', badge: { order: nextOrder } })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Badge
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat badges...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>local_offer</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada badge'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan badge baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && (
            <button onClick={() => setModal({ mode: 'add', badge: { order: nextOrder } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Badge
            </button>
          )}
        </div>
      ) : (
        <>
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['#', 'Nama', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText, border: `1px solid ${theme.accentSoftBorder}` }}>{b.name}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{b.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setModal({ mode: 'edit', badge: b })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const btn = e.currentTarget as HTMLButtonElement; btn.style.color = theme.accent; btn.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const btn = e.currentTarget as HTMLButtonElement; btn.style.color = theme.textMuted; btn.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(b.id, b.name)} disabled={deletingId === b.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const btn = e.currentTarget as HTMLButtonElement; btn.style.color = theme.danger; btn.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const btn = e.currentTarget as HTMLButtonElement; btn.style.color = theme.textMuted; btn.style.background = 'none' }}>
                          {deletingId === b.id
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
