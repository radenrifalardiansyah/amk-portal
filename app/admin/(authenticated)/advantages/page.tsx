'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import IconPickerField from '@/components/admin/IconPickerField'
import { advantagesService } from '@/lib/services'
import type { Advantage } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const emptyAdvantage: Advantage = { id: '', icon: 'target', title: '', body: '', order: 1 }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function AdvantageModal({
  mode, advantage, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  advantage: Partial<Advantage>
  onClose: () => void
  onSave: (data: Advantage) => void
}) {
  const [form, setForm] = useState<Advantage>({ ...emptyAdvantage, ...advantage })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof Advantage, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: slugify(form.title) } : form
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
            {mode === 'add' ? 'Tambah Advantage' : 'Edit Advantage'}
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
                placeholder="target"
                onChange={(icon) => set('icon', icon)}
              />
            </div>
            <div>
              <label style={labelStyle}>Judul *</label>
              <input className={inputCls} style={inputStyle} required value={form.title}
                placeholder="Precision Execution"
                onChange={(e) => set('title', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <div>
              <label style={labelStyle}>Body *</label>
              <textarea rows={4} className={inputCls} style={{ ...inputStyle, resize: 'none' }} required
                value={form.body} placeholder="Deskripsi keunggulan..."
                onChange={(e) => set('body', e.target.value)}
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

export default function AdvantagesPage() {
  const [advantages, setAdvantages] = useState<Advantage[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; advantage: Partial<Advantage> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const pageSize = 9

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAdvantages = useCallback(async () => {
    setLoading(true)
    try {
      setAdvantages(await advantagesService.getAll())
    } catch {
      showToast('error', 'Gagal memuat advantages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdvantages() }, [fetchAdvantages])

  const handleSave = async (data: Advantage) => {
    try {
      await advantagesService.save(data)
      await fetchAdvantages()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Advantage berhasil ditambahkan!' : 'Advantage berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan advantage')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus advantage "${title}"?`)) return
    setDeletingId(id)
    try {
      await advantagesService.delete(id)
      await fetchAdvantages()
      showToast('success', 'Advantage berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus advantage')
    } finally {
      setDeletingId(null)
    }
  }

  const nextOrder = advantages.length ? Math.max(...advantages.map((a) => a.order)) + 1 : 1

  const filtered = advantages.filter((a) => {
    if (!search) return true
    return a.title.toLowerCase().includes(search.toLowerCase())
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {modal && (
        <AdvantageModal mode={modal.mode} advantage={modal.advantage} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari advantage..." value={search}
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

        <button onClick={() => setModal({ mode: 'add', advantage: { order: nextOrder } })}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Advantage
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat advantages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>military_tech</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada advantage'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Tambahkan advantage baru untuk mulai mengelola konten'}</p>
          </div>
          {!search && (
            <button onClick={() => setModal({ mode: 'add', advantage: { order: nextOrder } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(37,99,235,0.25)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Advantage
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginated.map((a, i) => (
            <div key={a.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.accent }}>{a.icon}</span>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: theme.surfaceSoft, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                    #{a.order}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 6, lineHeight: 1.3, fontFamily: theme.fontHeadline, fontSize: 14 }}>{a.title}</h3>
                <p style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.55, marginBottom: 14 }} className="line-clamp-3">{a.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  <button onClick={() => setModal({ mode: 'edit', advantage: a })}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  <button onClick={() => handleDelete(a.id, a.title)} disabled={deletingId === a.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.danger, background: theme.dangerSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoftHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.dangerSoft }}>
                    {deletingId === a.id
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
                  {['#', 'Icon', 'Judul', 'Body', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${theme.divider}`, transition: 'background 0.12s' }}
                    className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{(page - 1) * pageSize + i + 1}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.accent }}>{a.icon}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{a.title}</td>
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 11.5 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{a.body}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{a.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setModal({ mode: 'edit', advantage: a })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(a.id, a.title)} disabled={deletingId === a.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'all 0.12s' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === a.id
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
