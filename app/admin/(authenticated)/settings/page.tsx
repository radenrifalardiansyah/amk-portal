'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/admin/Toast'
import { usersService } from '@/lib/services'
import type { AdminUser } from '@/lib/services'
import { uploadMedia } from '@/lib/upload'
import { seedInitialContent, type SeedResult } from '@/lib/seedContent'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

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

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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
    </div>
  )
}

type TabKey = 'profile' | 'security' | 'system'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profil', icon: 'person' },
  { key: 'security', label: 'Keamanan', icon: 'lock' },
  { key: 'system', label: 'Sistem', icon: 'database' },
]

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [profile, setProfile] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [seeding, setSeeding] = useState(false)
  const [seedResults, setSeedResults] = useState<SeedResult[] | null>(null)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const session = usersService.getSession()
      if (!session) {
        router.replace('/admin/login')
        return
      }
      const fresh = await usersService.getByEmail(session.email)
      setProfile(fresh)
    } catch {
      showToast('error', 'Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    try {
      const url = await uploadMedia(file, 'avatars')
      setProfile({ ...profile, avatarUrl: url })
      showToast('success', 'Foto profil diunggah, jangan lupa simpan perubahan')
    } catch {
      showToast('error', 'Gagal mengunggah foto profil')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
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

  const initials = (profile?.name || profile?.email || 'A')[0].toUpperCase()

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
                    <button type="button" onClick={handleAvatarPick} disabled={uploadingAvatar}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: uploadingAvatar ? 'not-allowed' : 'pointer' }}>
                      {uploadingAvatar
                        ? <><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full admin-spin" />Mengunggah...</>
                        : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>Ganti Foto</>}
                    </button>
                    <p style={{ fontSize: 11, color: theme.textMuted }}>JPG atau PNG, disarankan rasio 1:1</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Informasi Akun" subtitle="Detail identitas yang digunakan pada portal admin">
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
              </SectionCard>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSaveProfile} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: saving ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan Profil</>}
                </button>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <SectionCard title="Ubah Password" subtitle="Gunakan password yang kuat dan tidak digunakan di tempat lain">
                <Field label="Password Saat Ini">
                  <TextInput type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Masukkan password saat ini" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Password Baru">
                    <TextInput type="password" value={newPassword} onChange={setNewPassword} placeholder="Minimal 6 karakter" />
                  </Field>
                  <Field label="Konfirmasi Password Baru">
                    <TextInput type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Ulangi password baru" />
                  </Field>
                </div>
              </SectionCard>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleChangePassword} disabled={changingPassword}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: changingPassword ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: changingPassword ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
                  {changingPassword
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock_reset</span>Ubah Password</>}
                </button>
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <SectionCard title="Seed Konten Awal" subtitle="Isi Firestore dengan konten awal untuk koleksi yang masih kosong">
              <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.6 }}>
                Aksi ini hanya mengisi koleksi Firestore yang saat ini <strong>masih kosong</strong> (Services, Portfolio,
                Advantages, Key Partners, Clients, Leadership, Badges, dan konten Home/About/Contact/Profil Perusahaan).
                Koleksi yang sudah punya data tidak akan ditimpa, sehingga aman dijalankan berkali-kali.
              </p>
              <div>
                <button onClick={handleSeed} disabled={seeding}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: seeding ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: seeding ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: seeding ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
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
          )}
        </div>
      )}
    </>
  )
}
