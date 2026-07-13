'use client'

import { Fragment, useEffect, useState } from 'react'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import { modulesService, menuItemsService, rolePermissionService, usersService } from '@/lib/services'
import type { Role, PermissionMap, ModulePermission, AdminMenuItem } from '@/lib/services'
import { buildModuleMenuGroups, type ModuleMenuGroup } from '@/lib/adminMenuTree'
import { theme } from '@/lib/admin-theme'
import { revalidatePaths } from '@/lib/revalidate'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: 'admin', label: 'Admin', icon: 'shield_person' },
  { key: 'editor', label: 'Editor', icon: 'edit_note' },
]

const USERS_COLLAPSE_THRESHOLD = 6

const PERMISSION_COLUMNS: { key: keyof ModulePermission; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
]

// Menu ids yang punya kemunculan langsung di portal (navbar dan/atau section homepage).
const PORTAL_MAPPED_IDS = new Set([
  'homepage', 'about', 'services', 'portfolio', 'gallery', 'teams', 'news', 'advantages', 'clients',
])

export default function HakAksesPage() {
  const [role, setRole] = useState<Role>('admin')
  const { data: users = [], isLoading: usersLoading } = useSWR('admin-users-list', usersService.getAll)
  const { data: modules = [] } = useSWR('admin-modules', modulesService.getAll)
  const { data: menuItems = [], isLoading: itemsLoading, mutate: mutateMenuItems } = useSWR('admin-menu-items', menuItemsService.getAll)
  const { data: savedPermissions, isLoading: permissionsLoading, mutate } = useSWR(
    ['role-permissions', role],
    () => rolePermissionService.get(role),
  )

  const [draft, setDraft] = useState<PermissionMap | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [usersExpanded, setUsersExpanded] = useState(false)

  useEffect(() => {
    setDraft(savedPermissions ?? null)
  }, [savedPermissions])

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const toggle = (menuId: string, column: keyof ModulePermission) => {
    setDraft((prev) => {
      if (!prev) return prev
      const current = prev[menuId] ?? { view: false, edit: false, delete: false, approve: false }
      return { ...prev, [menuId]: { ...current, [column]: !current[column] } }
    })
  }

  const getModuleColumnState = (group: ModuleMenuGroup, column: keyof ModulePermission): 'all' | 'none' | 'partial' => {
    if (!draft) return 'none'
    let checked = 0
    group.rows.forEach(({ item }) => {
      const perm = draft[item.id] ?? { view: false, edit: false, delete: false, approve: false }
      if (perm[column]) checked += 1
    })
    if (checked === 0) return 'none'
    if (checked === group.rows.length) return 'all'
    return 'partial'
  }

  const toggleModuleColumn = (group: ModuleMenuGroup, column: keyof ModulePermission) => {
    const nextValue = getModuleColumnState(group, column) !== 'all'
    setDraft((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      group.rows.forEach(({ item }) => {
        const current = next[item.id] ?? { view: false, edit: false, delete: false, approve: false }
        next[item.id] = { ...current, [column]: nextValue }
      })
      return next
    })
  }

  const togglePortalView = async (item: AdminMenuItem) => {
    const nextValue = item.showOnPortal === false
    try {
      await menuItemsService.save({ ...item, showOnPortal: nextValue })
      await mutateMenuItems()
      await revalidatePaths(['/', '/about', '/portfolio', '/gallery', '/news'])
    } catch {
      showToast('error', 'Gagal memperbarui tampilan portal')
    }
  }

  const portalMappedRows = (group: ModuleMenuGroup) => group.rows.filter(({ item }) => PORTAL_MAPPED_IDS.has(item.id))

  const getGroupPortalState = (group: ModuleMenuGroup): 'all' | 'none' | 'partial' => {
    const mapped = portalMappedRows(group)
    if (mapped.length === 0) return 'none'
    const checked = mapped.filter(({ item }) => item.showOnPortal !== false).length
    if (checked === 0) return 'none'
    if (checked === mapped.length) return 'all'
    return 'partial'
  }

  const toggleGroupPortal = async (group: ModuleMenuGroup) => {
    const mapped = portalMappedRows(group)
    if (mapped.length === 0) return
    const nextValue = getGroupPortalState(group) !== 'all'
    try {
      await Promise.all(mapped.map(({ item }) => menuItemsService.save({ ...item, showOnPortal: nextValue })))
      await mutateMenuItems()
      await revalidatePaths(['/', '/about', '/portfolio', '/gallery', '/news'])
    } catch {
      showToast('error', 'Gagal memperbarui tampilan portal')
    }
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    try {
      await rolePermissionService.save(role, draft)
      await mutate()
      showToast('success', `Hak akses role ${role === 'admin' ? 'Admin' : 'Editor'} berhasil disimpan!`)
    } catch {
      showToast('error', 'Gagal menyimpan hak akses')
    } finally {
      setSaving(false)
    }
  }

  const governedItems = menuItems.filter((m) => !m.alwaysVisible)
  const moduleGroups = buildModuleMenuGroups(modules, governedItems)
  const roleUsers = users.filter((u) => u.role === role)
  const usersOverflowing = roleUsers.length > USERS_COLLAPSE_THRESHOLD
  const visibleUsers = usersOverflowing && !usersExpanded ? roleUsers.slice(0, USERS_COLLAPSE_THRESHOLD) : roleUsers
  const loading = itemsLoading || permissionsLoading || !draft

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, width: 'fit-content' }}>
          {ROLES.map((r) => (
            <button key={r.key} onClick={() => { setRole(r.key); setUsersExpanded(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontWeight: 600, background: role === r.key ? theme.accentSoftHover : 'transparent', color: role === r.key ? theme.accentText : theme.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, boxShadow: theme.shadowCard, padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: theme.text }}>
            Pengguna dengan Role {role === 'admin' ? 'Admin' : 'Editor'}
          </p>
          <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: theme.accentSoft, color: theme.accentText }}>
            {roleUsers.length} pengguna
          </span>
        </div>
        {usersLoading ? (
          <p style={{ fontSize: 12, color: theme.textMuted }}>Memuat pengguna...</p>
        ) : roleUsers.length === 0 ? (
          <p style={{ fontSize: 12, color: theme.textMuted }}>Belum ada pengguna dengan role ini.</p>
        ) : (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {visibleUsers.map((u) => (
              <div key={u.email} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', borderRadius: 10, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`, flexShrink: 0 }}>
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (u.name || u.email)[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: theme.text, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{u.name || u.email}</p>
                  <p style={{ fontSize: 10.5, color: theme.textMuted, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
          {usersOverflowing && (
            <button onClick={() => setUsersExpanded((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, padding: '5px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{usersExpanded ? 'expand_less' : 'expand_more'}</span>
              {usersExpanded ? 'Sembunyikan' : `Lihat semua (${roleUsers.length})`}
            </button>
          )}
          </>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat hak akses...</p>
        </div>
      ) : (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>Menu</th>
                  {PERMISSION_COLUMNS.map((c) => (
                    <th key={c.key} style={{ padding: '10px 20px', textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>{c.label}</th>
                  ))}
                  {role === 'admin' && (
                    <th style={{ padding: '10px 20px', textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft }}>Tampil di Portal</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {moduleGroups.map((group) => (
                  <Fragment key={group.module.id}>
                    <tr style={{ background: theme.surfaceSoft }}>
                      <td style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted }}>
                        {group.module.label}
                      </td>
                      {PERMISSION_COLUMNS.map((c) => (
                        <td key={c.key} style={{ padding: '8px 20px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            title={`Pilih semua ${c.label} untuk modul ${group.module.label}`}
                            checked={getModuleColumnState(group, c.key) === 'all'}
                            onChange={() => toggleModuleColumn(group, c.key)}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: theme.accent }}
                          />
                        </td>
                      ))}
                      {role === 'admin' && (
                        <td style={{ padding: '8px 20px', textAlign: 'center' }}>
                          {portalMappedRows(group).length > 0 && (
                            <input
                              type="checkbox"
                              title={`Pilih semua Tampil di Portal untuk modul ${group.module.label}`}
                              checked={getGroupPortalState(group) === 'all'}
                              onChange={() => toggleGroupPortal(group)}
                              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: theme.accent }}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                    {group.rows.map(({ item, depth }) => {
                      const perm = draft![item.id] ?? { view: false, edit: false, delete: false, approve: false }
                      return (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${theme.divider}` }} className="hover:bg-slate-50">
                          <td style={{ padding: '10px 20px', paddingLeft: depth === 1 ? 38 : 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {depth === 1 && (
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: theme.textMuted }}>subdirectory_arrow_right</span>
                            )}
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: theme.textMuted }}>{item.icon}</span>
                            <span style={{ fontWeight: depth === 1 ? 500 : 600, color: depth === 1 ? theme.textSecondary : theme.text, fontSize: 12.5 }}>{item.label}</span>
                          </td>
                          {PERMISSION_COLUMNS.map((c) => (
                            <td key={c.key} style={{ padding: '10px 20px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={perm[c.key]}
                                onChange={() => toggle(item.id, c.key)}
                                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: theme.accent }}
                              />
                            </td>
                          ))}
                          {role === 'admin' && (
                            <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                              {PORTAL_MAPPED_IDS.has(item.id) ? (
                                <input
                                  type="checkbox"
                                  title="Tampilkan menu/section ini di portal (frontend)"
                                  checked={item.showOnPortal !== false}
                                  onChange={() => togglePortalView(item)}
                                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: theme.accent }}
                                />
                              ) : (
                                <span style={{ fontSize: 11, color: theme.textMuted }}>—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </Fragment>
                ))}
                {governedItems.length === 0 && (
                  <tr>
                    <td colSpan={PERMISSION_COLUMNS.length + 1 + (role === 'admin' ? 1 : 0)} style={{ padding: '32px 20px', textAlign: 'center', color: theme.textMuted, fontSize: 12.5 }}>
                      Belum ada menu yang diatur matrix. Tambahkan menu di halaman Struktur Menu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: `1px solid ${theme.divider}` }}>
            <button onClick={handleSave} disabled={saving || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || loading) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || loading) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
