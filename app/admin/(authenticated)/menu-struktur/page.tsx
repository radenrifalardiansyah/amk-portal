'use client'

import { Fragment, useState } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import SearchSelect from '@/components/admin/SearchSelect'
import IconPickerField from '@/components/admin/IconPickerField'
import { modulesService, menuItemsService } from '@/lib/services'
import type { AdminModule, AdminMenuItem } from '@/lib/services'
import { buildModuleMenuGroups } from '@/lib/adminMenuTree'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
      <div>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? theme.accent : theme.border, position: 'relative', transition: 'background 0.15s',
        }}>
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.15s',
        }} />
      </button>
    </div>
  )
}

function ModuleModal({
  mode, module: mod, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  module: Partial<AdminModule>
  onClose: () => void
  onSave: (data: AdminModule) => void
}) {
  const [form, setForm] = useState<AdminModule>({ id: '', label: '', order: 1, ...mod })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof AdminModule, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: slugify(form.label) } : form
    await onSave(data)
    setSaving(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-full flex items-start justify-center py-8">
      <div className="w-full max-w-md admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Modul' : 'Edit Modul'}
          </h3>
          <button onClick={onClose}
            style={{ padding: 8, borderRadius: 8, background: theme.surfaceSoft, border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label style={labelStyle}>Nama Modul *</label>
              <input className={inputCls} style={inputStyle} required value={form.label}
                placeholder="Konten Website"
                onChange={(e) => set('label', e.target.value)}
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
              style={{ padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent }}>
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

function MenuItemModal({
  mode, item, modules, siblings, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  item: Partial<AdminMenuItem>
  modules: AdminModule[]
  siblings: AdminMenuItem[]
  onClose: () => void
  onSave: (data: AdminMenuItem) => void
}) {
  const empty: AdminMenuItem = {
    id: '', moduleId: modules[0]?.id ?? '', parentId: null, href: '', icon: 'dashboard',
    label: '', subtitle: '', order: 1, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true,
  }
  const [form, setForm] = useState<AdminMenuItem>({ ...empty, ...item })
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof AdminMenuItem>(k: K, v: AdminMenuItem[K]) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = mode === 'add' ? { ...form, id: slugify(form.label) } : form
    await onSave(data)
    setSaving(false)
  }

  const parentOptions = siblings
    .filter((s) => s.moduleId === form.moduleId && s.id !== form.id && !s.parentId)
    .map((s) => ({ value: s.id, label: s.label }))

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="min-h-full flex items-start justify-center py-8">
      <div className="w-full max-w-lg admin-scale-in"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
          <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>
            {mode === 'add' ? 'Tambah Menu' : 'Edit Menu'}
          </h3>
          <button onClick={onClose}
            style={{ padding: 8, borderRadius: 8, background: theme.surfaceSoft, border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Label *</label>
                <input className={inputCls} style={inputStyle} required value={form.label}
                  placeholder="Portfolio"
                  onChange={(e) => set('label', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
              <div>
                <label style={labelStyle}>Href *</label>
                <input className={inputCls} style={inputStyle} required value={form.href}
                  placeholder="/admin/portfolio"
                  onChange={(e) => set('href', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Subjudul</label>
              <input className={inputCls} style={inputStyle} value={form.subtitle}
                placeholder="Kelola proyek portfolio"
                onChange={(e) => set('subtitle', e.target.value)}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <IconPickerField label="Icon" value={form.icon} onChange={(v) => set('icon', v)} placeholder="photo_library" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Modul *</label>
                <SearchSelect
                  value={form.moduleId}
                  options={modules.map((m) => ({ value: m.id, label: m.label }))}
                  onChange={(v) => set('moduleId', v)}
                  allowClear={false}
                  placeholder="Pilih modul"
                />
              </div>
              <div>
                <label style={labelStyle}>Menu Induk</label>
                <SearchSelect
                  value={form.parentId ?? ''}
                  options={parentOptions}
                  onChange={(v) => set('parentId', v || null)}
                  clearLabel="Tidak ada (menu utama)"
                  placeholder="Tidak ada (menu utama)"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Urutan *</label>
              <input type="number" className={inputCls} style={inputStyle} required value={form.order}
                onChange={(e) => set('order', Number(e.target.value))}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)} />
            </div>
            <Toggle label="Selalu Terlihat" hint="Lewati matrix hak akses — tampil untuk semua role (mis. Dashboard)"
              checked={form.alwaysVisible} onChange={(v) => set('alwaysVisible', v)} />
            <Toggle label="Khusus Admin" hint="Hanya bisa diakses role admin, di luar matrix hak akses"
              checked={form.adminOnly} onChange={(v) => set('adminOnly', v)} />
            <Toggle label="Tampil di Bottom Nav" hint="Ditampilkan di navigasi bawah versi mobile"
              checked={form.showInBottomNav} onChange={(v) => set('showInBottomNav', v)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${theme.divider}` }}>
            <button type="button" onClick={onClose}
              style={{ padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent }}>
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

function ModulTab() {
  const { data: modules = [], isLoading: loading, mutate } = useSWR('admin-modules', modulesService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; module: Partial<AdminModule> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async (data: AdminModule) => {
    try {
      await modulesService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Modul berhasil ditambahkan!' : 'Modul berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan modul')
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Hapus modul "${label}"? Menu yang masih terhubung ke modul ini tidak akan tampil di sidebar.`)) return
    setDeletingId(id)
    try {
      await modulesService.delete(id)
      await mutate()
      showToast('success', 'Modul berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus modul')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = modules.filter((m) => !search || m.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {modal && <ModuleModal mode={modal.mode} module={modal.module} onClose={() => setModal(null)} onSave={handleSave} />}

      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari modul..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          <button disabled title="Sementara dinonaktifkan"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'not-allowed', boxShadow: 'none', opacity: 0.5, whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Modul
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat modul...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada modul'}</p>
          {search && <p style={{ fontSize: 12, color: theme.textMuted }}>Coba keyword lain</p>}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m, idx) => (
            <div key={m.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: theme.shadowCard, padding: 14, display: 'flex', alignItems: 'center', gap: 12, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: theme.textMuted, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: theme.text, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</p>
                <p style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>Urutan #{m.order}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <button onClick={() => setModal({ mode: 'edit', module: m })}
                  style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                </button>
                <button onClick={() => handleDelete(m.id, m.label)} disabled={deletingId === m.id}
                  style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                  {deletingId === m.id
                    ? <span className="w-4 h-4 border-2 rounded-full admin-spin block" style={{ borderColor: theme.divider, borderTopColor: theme.danger }} />
                    : <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['#', 'Nama Modul', 'Urutan', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${theme.divider}` }} className="hover:bg-slate-50">
                    <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{idx + 1}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: theme.text, fontSize: 13 }}>{m.label}</td>
                    <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 13 }}>#{m.order}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setModal({ mode: 'edit', module: m })}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(m.id, m.label)} disabled={deletingId === m.id}
                          style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                          {deletingId === m.id
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
      )}
    </>
  )
}

function MenuTab() {
  const { data: modules = [] } = useSWR('admin-modules', modulesService.getAll)
  const { data: items = [], isLoading: loading, mutate } = useSWR('admin-menu-items', menuItemsService.getAll)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item: Partial<AdminMenuItem> } | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('table')

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const parentLabel = (id: string | null) => (id ? items.find((i) => i.id === id)?.label ?? id : '—')

  const handleSave = async (data: AdminMenuItem) => {
    try {
      await menuItemsService.save(data)
      await mutate()
      setModal(null)
      showToast('success', modal?.mode === 'add' ? 'Menu berhasil ditambahkan!' : 'Menu berhasil diperbarui!')
    } catch {
      showToast('error', 'Gagal menyimpan menu')
    }
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Hapus menu "${label}"?`)) return
    setDeletingId(id)
    try {
      await menuItemsService.delete(id)
      await mutate()
      showToast('success', 'Menu berhasil dihapus')
    } catch {
      showToast('error', 'Gagal menghapus menu')
    } finally {
      setDeletingId(null)
    }
  }

  const moveItem = async (item: AdminMenuItem, direction: 'up' | 'down') => {
    const siblings = items.filter((i) => i.parentId === item.parentId && i.moduleId === item.moduleId).sort((a, b) => a.order - b.order)
    const idx = siblings.findIndex((s) => s.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= siblings.length) return
    const other = siblings[swapIdx]
    setMovingId(item.id)
    try {
      await Promise.all([
        menuItemsService.save({ ...item, order: other.order }),
        menuItemsService.save({ ...other, order: item.order }),
      ])
      await mutate()
    } catch {
      showToast('error', 'Gagal mengubah urutan')
    } finally {
      setMovingId(null)
    }
  }

  const moduleGroups = buildModuleMenuGroups(modules, items)

  const q = search.trim().toLowerCase()
  const filteredGroups = q
    ? moduleGroups
        .map((group) => ({
          ...group,
          rows: group.rows.filter(({ item }) =>
            item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)),
        }))
        .filter((group) => group.rows.length > 0)
    : moduleGroups
  const hasResults = filteredGroups.some((g) => g.rows.length > 0)

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {modal && (
        <MenuItemModal mode={modal.mode} item={modal.item} modules={modules} siblings={items}
          onClose={() => setModal(null)} onSave={handleSave} />
      )}

      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari menu..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>

          <button disabled title="Sementara dinonaktifkan"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', cursor: 'not-allowed', boxShadow: 'none', opacity: 0.5, whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Tambah Menu
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat menu...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>Belum ada menu</p>
          <p style={{ fontSize: 12, color: theme.textMuted }}>Gunakan tombol &quot;Seed Data Awal&quot; di halaman Pengaturan Profil, atau tambahkan menu manual</p>
        </div>
      ) : !hasResults ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>Tidak ditemukan</p>
          <p style={{ fontSize: 12, color: theme.textMuted }}>Coba keyword lain</p>
        </div>
      ) : view === 'grid' ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.module.id}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted, marginBottom: 8, paddingLeft: 2 }}>
                  {group.module.label}
                </p>
                <div className="space-y-2">
                  {group.rows.map(({ item, depth, siblingIndex, siblingCount }) => (
                    <div key={item.id}
                      style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: theme.shadowCard, padding: 14, marginLeft: depth === 1 ? 18 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: theme.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 17, color: theme.accent }}>{item.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {depth === 1 && (
                              <span className="material-symbols-outlined" style={{ fontSize: 14, color: theme.textMuted, flexShrink: 0 }}>subdirectory_arrow_right</span>
                            )}
                            <p style={{ fontWeight: 600, color: theme.text, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</p>
                          </div>
                          <p style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.href}</p>
                          {item.parentId && (
                            <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Induk: {parentLabel(item.parentId)}</p>
                          )}
                          {(item.alwaysVisible || item.adminOnly || item.showInBottomNav) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {item.alwaysVisible && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>Selalu Terlihat</span>}
                              {item.adminOnly && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.dangerSoft, color: theme.danger }}>Admin</span>}
                              {item.showInBottomNav && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.surfaceSoft, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>Bottom Nav</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: theme.textSecondary, fontSize: 12.5 }}>Urutan #{item.order}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <button onClick={() => moveItem(item, 'up')} disabled={siblingIndex === 0 || movingId !== null}
                              style={{ padding: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: siblingIndex === 0 ? 'default' : 'pointer', color: siblingIndex === 0 ? theme.border : theme.textMuted, opacity: movingId !== null ? 0.5 : 1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_up</span>
                            </button>
                            <button onClick={() => moveItem(item, 'down')} disabled={siblingIndex === siblingCount - 1 || movingId !== null}
                              style={{ padding: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: siblingIndex === siblingCount - 1 ? 'default' : 'pointer', color: siblingIndex === siblingCount - 1 ? theme.border : theme.textMuted, opacity: movingId !== null ? 0.5 : 1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button onClick={() => setModal({ mode: 'edit', item })}
                            style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                          </button>
                          {!item.alwaysVisible && (
                            <button onClick={() => handleDelete(item.id, item.label)} disabled={deletingId === item.id}
                              style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                              {deletingId === item.id
                                ? <span className="w-4 h-4 border-2 rounded-full admin-spin block" style={{ borderColor: theme.divider, borderTopColor: theme.danger }} />
                                : <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
      ) : (
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['#', 'Label', 'Href', 'Induk', 'Urutan', 'Flag', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <Fragment key={group.module.id}>
                    <tr style={{ background: theme.surfaceSoft }}>
                      <td colSpan={7} style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted }}>
                        {group.module.label}
                      </td>
                    </tr>
                    {group.rows.map(({ item, depth, siblingIndex, siblingCount }) => (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${theme.divider}` }} className="hover:bg-slate-50">
                        <td style={{ padding: '12px 20px', color: theme.textMuted, fontSize: 12.5 }}>{siblingIndex + 1}</td>
                        <td style={{ padding: '12px 20px', paddingLeft: depth === 1 ? 44 : 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {depth === 1 && (
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.textMuted }}>subdirectory_arrow_right</span>
                          )}
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.accent }}>{item.icon}</span>
                          <span style={{ fontWeight: depth === 1 ? 500 : 600, color: depth === 1 ? theme.textSecondary : theme.text, fontSize: 13 }}>{item.label}</span>
                        </td>
                        <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 12.5 }}>{item.href}</td>
                        <td style={{ padding: '12px 20px', color: theme.textSecondary, fontSize: 12.5 }}>{parentLabel(item.parentId)}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: theme.textSecondary, fontSize: 13 }}>#{item.order}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <button onClick={() => moveItem(item, 'up')} disabled={siblingIndex === 0 || movingId !== null}
                                title="Naikkan urutan"
                                style={{ padding: 0, width: 16, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: siblingIndex === 0 ? 'default' : 'pointer', color: siblingIndex === 0 ? theme.border : theme.textMuted, opacity: movingId !== null ? 0.5 : 1 }}
                                onMouseEnter={(e) => { if (siblingIndex !== 0) (e.currentTarget as HTMLButtonElement).style.color = theme.accent }}
                                onMouseLeave={(e) => { if (siblingIndex !== 0) (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_up</span>
                              </button>
                              <button onClick={() => moveItem(item, 'down')} disabled={siblingIndex === siblingCount - 1 || movingId !== null}
                                title="Turunkan urutan"
                                style={{ padding: 0, width: 16, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: siblingIndex === siblingCount - 1 ? 'default' : 'pointer', color: siblingIndex === siblingCount - 1 ? theme.border : theme.textMuted, opacity: movingId !== null ? 0.5 : 1 }}
                                onMouseEnter={(e) => { if (siblingIndex !== siblingCount - 1) (e.currentTarget as HTMLButtonElement).style.color = theme.accent }}
                                onMouseLeave={(e) => { if (siblingIndex !== siblingCount - 1) (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>keyboard_arrow_down</span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {item.alwaysVisible && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>Selalu Terlihat</span>}
                            {item.adminOnly && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.dangerSoft, color: theme.danger }}>Admin</span>}
                            {item.showInBottomNav && <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.surfaceSoft, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>Bottom Nav</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={() => setModal({ mode: 'edit', item })}
                              style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.accent; b.style.background = theme.accentSoft }}
                              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                            </button>
                            {!item.alwaysVisible && (
                            <button onClick={() => handleDelete(item.id, item.label)} disabled={deletingId === item.id}
                              style={{ padding: 7, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
                              onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
                              onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}>
                              {deletingId === item.id
                                ? <span className="w-4 h-4 border-2 rounded-full admin-spin block" style={{ borderColor: theme.divider, borderTopColor: theme.danger }} />
                                : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          </div>
      )}
    </>
  )
}

const TABS = [
  { key: 'modul', label: 'Modul', icon: 'view_module' },
  { key: 'menu', label: 'Menu', icon: 'menu' },
] as const

export default function MenuStrukturPage() {
  const [tab, setTab] = useState<typeof TABS[number]['key']>('modul')

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

      {tab === 'modul' ? <ModulTab /> : <MenuTab />}
    </>
  )
}
