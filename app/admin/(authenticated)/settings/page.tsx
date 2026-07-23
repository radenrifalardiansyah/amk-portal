'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import { usersService, notificationService } from '@/lib/services'
import type { AdminUser, SessionUser, NotificationPermissionState } from '@/lib/services'
import { uploadMedia, uploadErrorMessage } from '@/lib/upload'
import { seedInitialContent, type SeedResult } from '@/lib/seedContent'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import { auth } from '@/lib/firebase'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
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

function TextInput({ value, onChange, type = 'text', placeholder, disabled }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      className={inputCls}
      style={{ ...inputStyle, ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => !disabled && Object.assign(e.target.style, inputFocusStyle)}
      onBlur={(e) => !disabled && Object.assign(e.target.style, inputBlurStyle)}
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

function TextArea({ value, onChange, rows = 4, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      rows={rows} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
    />
  )
}

function SectionCard({ title, subtitle, footer, children }: { title: string; subtitle: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden admin-fade-up"
      style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard }}
    >
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.divider}` }}>
        <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>{title}</h2>
        <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{subtitle}</p>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
      {footer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: `1px solid ${theme.divider}` }}>
          {footer}
        </div>
      )}
    </div>
  )
}

type TabKey = 'profile' | 'security' | 'system'

const BASE_TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profil', icon: 'person' },
  { key: 'security', label: 'Keamanan', icon: 'lock' },
]

const SYSTEM_TAB = { key: 'system' as const, label: 'Sistem', icon: 'settings_suggest' }

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [session, setSession] = useState<SessionUser | null>(null)
  const { data: profileData, isLoading: profileLoading, mutate } = useSWR(
    session ? ['admin-profile', session.email] : null,
    () => usersService.getByEmail(session!.email)
  )
  const [profile, setProfile] = useState<AdminUser | null>(null)
  const loading = !session || profileLoading
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarLinkMode, setAvatarLinkMode] = useState(false)
  const [avatarLinkDraft, setAvatarLinkDraft] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [notifState, setNotifState] = useState<NotificationPermissionState>('default')
  const [notifBusy, setNotifBusy] = useState(false)

  const [seeding, setSeeding] = useState(false)
  const [seedResults, setSeedResults] = useState<SeedResult[] | null>(null)
  const [deploying, setDeploying] = useState(false)

  const TABS = profile?.role === 'admin' ? [...BASE_TABS, SYSTEM_TAB] : BASE_TABS

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

  useEffect(() => {
    if (profileData && !profile) setProfile(profileData)
  }, [profileData, profile])

  useEffect(() => {
    notificationService.getState().then(setNotifState)
  }, [])

  const handleToggleNotif = async () => {
    if (!session?.email) return
    setNotifBusy(true)
    try {
      if (notifState === 'granted') {
        await notificationService.disable(session.email)
        setNotifState('default')
        showToast('success', 'Notifikasi chat dimatikan')
      } else {
        const result = await notificationService.enable(session.email)
        if (result.ok) {
          setNotifState('granted')
          showToast('success', 'Notifikasi chat diaktifkan')
        } else {
          setNotifState(await notificationService.getState())
          showToast('error', result.error || 'Gagal mengaktifkan notifikasi')
        }
      }
    } finally {
      setNotifBusy(false)
    }
  }

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (!file.type.startsWith('image/')) {
      showToast('error', 'File harus berupa gambar (JPG/PNG)')
      e.target.value = ''
      return
    }
    setUploadingAvatar(true)
    try {
      const url = await uploadMedia(file, 'avatars', undefined, 512, 512, true)
      const updated = { ...profile, avatarUrl: url }
      await usersService.updateProfile(profile.email, { avatarUrl: url })
      setProfile(updated)
      usersService.saveSession(updated)
      await mutate(updated, false)
      showToast('success', 'Foto profil berhasil disimpan!')
    } catch (err) {
      console.error('Upload failed:', err)
      showToast('error', uploadErrorMessage(err))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const applyAvatarLink = async () => {
    const url = avatarLinkDraft.trim()
    if (!profile) return
    if (!/^https?:\/\//i.test(url)) {
      showToast('error', 'Link harus diawali http:// atau https://')
      return
    }
    setUploadingAvatar(true)
    try {
      const updated = { ...profile, avatarUrl: url }
      await usersService.updateProfile(profile.email, { avatarUrl: url })
      setProfile(updated)
      usersService.saveSession(updated)
      await mutate(updated, false)
      showToast('success', 'Foto profil berhasil disimpan!')
      setAvatarLinkMode(false)
      setAvatarLinkDraft('')
    } catch {
      showToast('error', 'Gagal menyimpan link foto')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    if (!profile.name.trim()) {
      showToast('error', 'Nama tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      await usersService.updateProfile(profile.email, {
        name: profile.name.trim(),
        phone: profile.phone ?? '',
        position: profile.position ?? '',
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      })
      usersService.saveSession(profile)
      await mutate(profile, false)
      showToast('success', 'Profil berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!profile) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('error', 'Lengkapi semua kolom password')
      return
    }
    if (newPassword.length < 6) {
      showToast('error', 'Password baru minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi password baru tidak cocok')
      return
    }
    setChangingPassword(true)
    try {
      const ok = await usersService.changePassword(profile.email, currentPassword, newPassword)
      if (!ok) {
        showToast('error', 'Password saat ini salah')
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('success', 'Password berhasil diubah!')
    } catch {
      showToast('error', 'Gagal mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSeedResults(null)
    try {
      const results = await seedInitialContent()
      setSeedResults(results)
      const newlySeeded = results.filter((r) => r.seeded).length
      showToast('success', newlySeeded > 0
        ? `${newlySeeded} koleksi berhasil diisi ke Firestore`
        : 'Semua koleksi sudah terisi, tidak ada yang diubah')
    } catch {
      showToast('error', 'Gagal menjalankan seed data')
    } finally {
      setSeeding(false)
    }
  }

  const handleForceDeploy = async () => {
    if (!confirm('Yakin? Ini akan build ulang & regenerate SEMUA halaman situs dari awal. Pakai hanya kalau update konten benar-benar tidak muncul setelah disimpan.')) return
    setDeploying(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('NO_TOKEN')
      const res = await fetch('/api/force-deploy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('REQUEST_FAILED')
      showToast('success', 'Deploy dipicu! Situs akan ter-refresh penuh dalam 1-2 menit.')
    } catch {
      showToast('error', 'Gagal memicu deploy. Coba lagi atau hubungi developer.')
    } finally {
      setDeploying(false)
    }
  }

  const initials = (profile?.name || profile?.email || 'A')[0].toUpperCase()

  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentLoginHistory = (profile?.loginHistory ?? [])
    .filter((h) => new Date(h.at).getTime() >= sevenDaysAgoMs)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {loading || !profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat profil...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, width: 'fit-content' }}>
            {TABS.map((t) => {
              const isActive = activeTab === t.key
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: isActive ? theme.accentSoftHover : 'transparent',
                    color: isActive ? theme.accentText : theme.textSecondary,
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'profile' && (
            <>
              <SectionCard title="Foto Profil" subtitle="Foto ini akan tampil di sidebar dan header admin">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700, color: '#fff',
                    background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                  }}>
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleAvatarPick} disabled={uploadingAvatar}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                        {uploadingAvatar
                          ? <><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full admin-spin" />Mengunggah...</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>Ganti Foto</>}
                      </button>
                      <button type="button" onClick={() => setAvatarLinkMode((m) => !m)} disabled={uploadingAvatar}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.textSecondary, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span>Pakai Link
                      </button>
                    </div>
                    {avatarLinkMode && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="url"
                          autoFocus
                          placeholder="https://..."
                          value={avatarLinkDraft}
                          onChange={(e) => setAvatarLinkDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyAvatarLink() } }}
                          style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.surfaceSoft, color: theme.text }}
                        />
                        <button type="button" onClick={applyAvatarLink} disabled={uploadingAvatar}
                          style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: theme.accent, color: '#fff', border: 'none', cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                          Terapkan
                        </button>
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: theme.textMuted }}>JPG atau PNG, disarankan rasio 1:1</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Informasi Akun" subtitle="Detail identitas yang digunakan pada portal admin"
                footer={
                  <button onClick={handleSaveProfile} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: saving ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: saving ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
                    {saving
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                      : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan Profil</>}
                  </button>
                }
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nama Lengkap">
                    <TextInput value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} placeholder="Nama Anda" />
                  </Field>
                  <Field label="Email" hint="Email digunakan sebagai ID akun dan tidak dapat diubah">
                    <TextInput value={profile.email} onChange={() => {}} disabled />
                  </Field>
                  <Field label="No. Telepon">
                    <TextInput value={profile.phone ?? ''} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="08xxxxxxxxxx" />
                  </Field>
                  <Field label="Jabatan / Posisi">
                    <TextInput value={profile.position ?? ''} onChange={(v) => setProfile({ ...profile, position: v })} placeholder="cth. Content Manager" />
                  </Field>
                </div>
                <Field label="Bio / Tentang">
                  <TextArea value={profile.bio ?? ''} onChange={(v) => setProfile({ ...profile, bio: v })} placeholder="Deskripsi singkat tentang Anda" />
                </Field>
                <Field label="Role" hint="Role akun ditentukan oleh administrator sistem">
                  <TextInput value={profile.role === 'admin' ? 'Administrator' : 'Editor'} onChange={() => {}} disabled />
                </Field>
                <Field label="Login Terakhir">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, fontSize: 13, color: theme.textSecondary }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: theme.textMuted }}>
                      {profile.lastLoginDevice === 'mobile' ? 'smartphone' : 'computer'}
                    </span>
                    {profile.lastLoginAt
                      ? <span>{new Date(profile.lastLoginAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} · {profile.lastLoginDevice === 'mobile' ? 'Mobile' : 'Desktop'}</span>
                      : <span style={{ color: theme.textMuted }}>Belum ada catatan login</span>}
                  </div>
                </Field>
                <Field label="Riwayat Login (7 Hari Terakhir)" hint="Riwayat mulai tercatat sejak fitur ini aktif — login sebelumnya tidak tersimpan.">
                  {recentLoginHistory.length === 0 ? (
                    <p style={{ fontSize: 12, color: theme.textMuted, padding: '10px 12px', borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                      Belum ada riwayat login dalam 7 hari terakhir.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                      {recentLoginHistory.map((h, i) => (
                        <div key={`${h.at}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, fontSize: 12.5, color: theme.textSecondary }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: theme.textMuted }}>
                            {h.device === 'mobile' ? 'smartphone' : 'computer'}
                          </span>
                          <span>{new Date(h.at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })} · {h.device === 'mobile' ? 'Mobile' : 'Desktop'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </SectionCard>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <SectionCard title="Notifikasi Chat" subtitle="Dapatkan notifikasi push saat ada pesan baru, meski aplikasi tidak dibuka">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                      {notifState === 'granted' ? 'Notifikasi aktif di perangkat ini'
                        : notifState === 'denied' ? 'Notifikasi diblokir oleh browser'
                        : notifState === 'unsupported' ? 'Tidak didukung di browser ini'
                        : 'Notifikasi belum diaktifkan'}
                    </p>
                    <p style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 4 }}>
                      {notifState === 'denied'
                        ? 'Aktifkan lewat pengaturan notifikasi browser atau HP kamu, lalu muat ulang halaman ini'
                        : 'Berlaku untuk Team Chat & pesan pribadi di admin panel ini'}
                    </p>
                  </div>
                  {notifState !== 'unsupported' && notifState !== 'denied' && (
                    <button onClick={handleToggleNotif} disabled={notifBusy}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 12.5, fontWeight: 600, color: notifState === 'granted' ? theme.danger : '#fff', background: notifBusy ? 'rgba(0,0,0,0.05)' : notifState === 'granted' ? theme.dangerSoft : theme.accent, border: 'none', cursor: notifBusy ? 'default' : 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                      {notifBusy
                        ? <span className="w-4 h-4 border-2 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
                        : <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{notifState === 'granted' ? 'notifications_off' : 'notifications_active'}</span>}
                      {notifState === 'granted' ? 'Matikan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Ubah Password" subtitle="Gunakan password yang kuat dan tidak digunakan di tempat lain"
                footer={
                  <button onClick={handleChangePassword} disabled={changingPassword}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: changingPassword ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: changingPassword ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
                    {changingPassword
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                      : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock_reset</span>Ubah Password</>}
                  </button>
                }
              >
                <Field label="Password Saat Ini">
                  <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Masukkan password saat ini" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Password Baru">
                    <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Minimal 6 karakter" />
                  </Field>
                  <Field label="Konfirmasi Password Baru">
                    <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Ulangi password baru" />
                  </Field>
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'system' && (
            <>
            <SectionCard title="Paksa Refresh Situs" subtitle="Redeploy penuh — pakai kalau perubahan konten tidak muncul di situs live">
              <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.6 }}>
                Update konten biasanya langsung tampil otomatis begitu disimpan. Kalau muncul peringatan &ldquo;cache gagal di-refresh&rdquo;
                setelah menyimpan (misal karena kuota hosting sedang penuh), tombol ini memicu build ulang penuh di Vercel
                sehingga seluruh halaman ter-refresh dengan data terbaru, terlepas dari status cache saat ini.
              </p>
              <div>
                <button onClick={handleForceDeploy} disabled={deploying}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: deploying ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: deploying ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: deploying ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
                  {deploying
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Memicu deploy...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>bolt</span>Paksa Refresh Situs</>}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Seed Konten Awal" subtitle="Isi Firestore dengan konten awal untuk koleksi yang masih kosong">
              <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.6 }}>
                Aksi ini hanya mengisi koleksi Firestore yang saat ini <strong>masih kosong</strong> (Services, Portfolio,
                Advantages, Key Partners, Clients, Leadership, Core Business, dan konten Home/About/Contact/Profil Perusahaan).
                Koleksi yang sudah punya data tidak akan ditimpa, sehingga aman dijalankan berkali-kali.
              </p>
              <div>
                <button onClick={handleSeed} disabled={seeding}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: seeding ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: seeding ? 'rgba(7,82,183,0.5)' : theme.accent, boxShadow: seeding ? 'none' : '0 2px 12px rgba(7,82,183,0.25)' }}>
                  {seeding
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Mengisi Firestore...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>cloud_upload</span>Seed Konten Awal ke Firestore</>}
                </button>
              </div>

              {seedResults && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {seedResults.map((r) => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: r.seeded ? theme.accent : theme.textMuted }}>
                        {r.seeded ? 'check_circle' : 'remove_circle_outline'}
                      </span>
                      <span style={{ color: theme.textSecondary }}>{r.label}</span>
                      <span style={{ color: theme.textMuted }}>{r.seeded ? '— diisi' : '— sudah ada data, dilewati'}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
            </>
          )}
        </div>
      )}
    </>
  )
}
