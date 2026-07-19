'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { usersService } from '@/lib/services'
import type { AdminUser, SessionUser } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import SearchSelect from '@/components/admin/SearchSelect'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrator' },
]
const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type}
      className={inputCls}
      style={inputStyle}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
    />
  )
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={inputCls}
        style={{ ...inputStyle, paddingRight: 38 }}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
        onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
          {visible ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>
  )
}

function SectionCard({ title, subtitle, children, collapsible = false, defaultOpen = true }: {
  title: string; subtitle: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = !collapsible || open
  return (
    <div
      className="rounded-2xl overflow-hidden admin-fade-up"
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard }}
    >
      <div
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        style={{
          padding: '16px 20px', borderBottom: isOpen ? `1px solid ${theme.divider}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          cursor: collapsible ? 'pointer' : 'default', userSelect: collapsible ? 'none' : 'auto',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>{title}</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{subtitle}</p>
        </div>
        {collapsible && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: theme.textMuted, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          >
            expand_more
          </span>
        )}
      </div>
      {isOpen && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function PenggunaPage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionUser | null>(null)
  const { data: profile } = useSWR(
    session ? ['admin-profile', session.email] : null,
    () => usersService.getByEmail(session!.email),
  )
  const { data: allUsers = [], mutate: mutateUsers } = useSWR('admin-users-list', () => usersService.getAll())

  const [toast, setToast] = useState<ToastState | null>(null)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor')
  const [creatingUser, setCreatingUser] = useState(false)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editUserRole, setEditUserRole] = useState<'admin' | 'editor'>('editor')
  const [editUserPassword, setEditUserPassword] = useState('')
  const [savingUserEdit, setSavingUserEdit] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const userPageSize = 10

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const s = usersService.getSession()
    if (!s) {
      router.replace('/admin/login')
    } else {
      setSession(s)
    }
  }, [router])

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      showToast('error', 'Lengkapi nama, email, dan password')
      return
    }
    if (newUserPassword.length < 6) {
      showToast('error', 'Password minimal 6 karakter')
      return
    }
    setCreatingUser(true)
    try {
      await usersService.adminCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword,
        role: newUserRole,
      })
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('editor')
      await mutateUsers()
      showToast('success', 'Pengguna baru berhasil dibuat!')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal membuat pengguna')
    } finally {
      setCreatingUser(false)
    }
  }

  const openEditUser = (u: AdminUser) => {
    setEditingUser(u)
    setEditUserRole(u.role)
    setEditUserPassword('')
  }

  const handleSaveUserEdit = async () => {
    if (!editingUser) return
    if (editUserPassword && editUserPassword.length < 6) {
      showToast('error', 'Password minimal 6 karakter')
      return
    }
    setSavingUserEdit(true)
    try {
      await usersService.adminUpdateUser(editingUser.email, {
        role: editUserRole,
        ...(editUserPassword ? { password: editUserPassword } : {}),
      })
      await mutateUsers()
      setEditingUser(null)
      showToast('success', 'Pengguna berhasil diperbarui!')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui pengguna')
    } finally {
      setSavingUserEdit(false)
    }
  }

  const filteredUsers = allUsers.filter((u) => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize)

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Hapus akun ${email}? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeletingEmail(email)
    try {
      await usersService.adminDeleteUser(email)
      await mutateUsers()
      showToast('success', 'Pengguna berhasil dihapus')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus pengguna')
    } finally {
      setDeletingEmail(null)
    }
  }

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {editingUser && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto p-4"
          style={{ background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="min-h-full flex items-start justify-center py-8">
          <div className="w-full max-w-md admin-scale-in"
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowElevated }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${theme.divider}` }}>
              <h3 style={{ fontWeight: 700, color: theme.text, fontSize: 15, fontFamily: theme.fontHeadline }}>Edit Pengguna</h3>
              <button onClick={() => setEditingUser(null)}
                style={{ padding: 8, borderRadius: 8, background: theme.surfaceSoft, border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, wordBreak: 'break-word' }}>{editingUser.name}</p>
                <p style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2, wordBreak: 'break-word' }}>{editingUser.email}</p>
              </div>
              <Field label="Role">
                <SearchSelect
                  value={editUserRole}
                  options={ROLE_OPTIONS}
                  onChange={(v) => setEditUserRole(v as 'admin' | 'editor')}
                  allowClear={false}
                  disabled={editingUser.email === profile?.email}
                />
              </Field>
              <Field label="Reset Password" hint="Kosongkan jika tidak ingin mengubah password">
                <PasswordInput value={editUserPassword} onChange={setEditUserPassword} placeholder="Minimal 6 karakter" />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: `1px solid ${theme.divider}` }}>
              <button type="button" onClick={() => setEditingUser(null)}
                style={{ padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleSaveUserEdit} disabled={savingUserEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', background: savingUserEdit ? 'rgba(37,99,235,0.5)' : theme.accent }}>
                {savingUserEdit
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col gap-5">
        <SectionCard title="Tambah Pengguna" subtitle="Buat akun admin/editor baru langsung dari sini, tanpa perlu Firebase Console" collapsible defaultOpen={false}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap">
              <TextInput value={newUserName} onChange={setNewUserName} placeholder="Nama pengguna baru" />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={newUserEmail} onChange={setNewUserEmail} placeholder="nama@adikaramandalakreasi.com" />
            </Field>
            <Field label="Password">
              <PasswordInput value={newUserPassword} onChange={setNewUserPassword} placeholder="Minimal 6 karakter" />
            </Field>
            <Field label="Role">
              <SearchSelect
                value={newUserRole}
                options={ROLE_OPTIONS}
                onChange={(v) => setNewUserRole(v as 'admin' | 'editor')}
                allowClear={false}
              />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleCreateUser} disabled={creatingUser}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: creatingUser ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: creatingUser ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: creatingUser ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {creatingUser
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Membuat...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_add</span>Buat Pengguna</>}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Daftar Pengguna" subtitle="Semua akun yang bisa mengakses admin panel">
          <div className="relative">
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
            <input
              type="text" placeholder="Cari nama atau email..." value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
              className="w-full outline-none text-sm rounded-xl transition-all"
              style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paginatedUsers.map((u) => (
              <div key={u.email} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '10px 14px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceSoft,
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                  <p style={{ fontSize: 11.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email} · {u.role === 'admin' ? 'Administrator' : 'Editor'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => openEditUser(u)}
                    title="Edit role"
                    style={{ color: theme.textSecondary, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  </button>
                  {u.email !== profile?.email && (
                    <button
                      onClick={() => handleDeleteUser(u.email)}
                      disabled={deletingEmail === u.email}
                      title="Hapus pengguna"
                      style={{ color: theme.danger, background: theme.dangerSoft, border: 'none', borderRadius: 8, padding: 8, cursor: deletingEmail === u.email ? 'not-allowed' : 'pointer', display: 'flex' }}
                    >
                      {deletingEmail === u.email
                        ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full admin-spin" />
                        : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p style={{ fontSize: 12.5, color: theme.textMuted }}>
                {userSearch ? 'Tidak ditemukan.' : 'Belum ada pengguna lain.'}
              </p>
            )}
          </div>
          <Pagination page={userPage} pageSize={userPageSize} totalItems={filteredUsers.length} onPageChange={setUserPage} />
        </SectionCard>
      </div>
    </>
  )
}
