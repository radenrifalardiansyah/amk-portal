'use client'

import { useState, useEffect, useCallback } from 'react'
import Toast from '@/components/admin/Toast'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { siteContentService } from '@/lib/services'
import type { CompanyProfile } from '@/lib/services'
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

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className={inputCls} style={inputStyle} value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
    />
  )
}

function TextArea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
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

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchCompany = useCallback(async () => {
    setLoading(true)
    try {
      setCompany(await siteContentService.getCompany())
    } catch {
      showToast('error', 'Gagal memuat profil perusahaan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCompany() }, [fetchCompany])

  const handleSave = async () => {
    if (!company) return
    if (!company.legalName.trim()) {
      showToast('error', 'Nama resmi perusahaan tidak boleh kosong')
      return
    }
    setSaving(true)
    try {
      await siteContentService.saveCompany(company)
      showToast('success', 'Profil perusahaan berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan profil perusahaan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {loading || !company ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat profil perusahaan...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <SectionCard title="Logo" subtitle="Digunakan di navbar & footer website, serta sidebar admin">
            <div style={{ maxWidth: 220 }}>
              <MediaUploadField
                label="Logo Perusahaan"
                value={company.logoUrl}
                onChange={(url) => setCompany({ ...company, logoUrl: url })}
                folder="company"
                aspect="aspect-square"
                onUploadingChange={setUploadingLogo}
                onError={(msg) => showToast('error', msg)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Identitas Perusahaan" subtitle="Nama dan tagline yang tampil di website">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nama Resmi (PT)">
                <TextInput value={company.legalName} onChange={(v) => setCompany({ ...company, legalName: v })} placeholder="PT. Nama Perusahaan" />
              </Field>
              <Field label="Nama Singkat / Brand" hint="Ditampilkan sebagai teks alternatif logo">
                <TextInput value={company.shortName} onChange={(v) => setCompany({ ...company, shortName: v })} placeholder="cth. AMK" />
              </Field>
            </div>
            <Field label="Tagline / Deskripsi Singkat" hint="Muncul di footer website">
              <TextArea value={company.tagline} onChange={(v) => setCompany({ ...company, tagline: v })} />
            </Field>
          </SectionCard>

          <SectionCard title="Kontak & Alamat" subtitle="Informasi kontak resmi perusahaan">
            <Field label="Alamat">
              <TextArea rows={2} value={company.address} onChange={(v) => setCompany({ ...company, address: v })} placeholder="Alamat lengkap perusahaan" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email">
                <TextInput value={company.email} onChange={(v) => setCompany({ ...company, email: v })} placeholder="email@perusahaan.com" />
              </Field>
              <Field label="No. WhatsApp" hint="Format angka saja dengan kode negara, cth. 6281234567890">
                <TextInput value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} placeholder="6281234567890" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Media Sosial" subtitle="Tautan yang tampil sebagai ikon di footer website">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Instagram">
                <TextInput value={company.instagramUrl} onChange={(v) => setCompany({ ...company, instagramUrl: v })} placeholder="https://instagram.com/namaakun" />
              </Field>
              <Field label="LinkedIn">
                <TextInput value={company.linkedinUrl} onChange={(v) => setCompany({ ...company, linkedinUrl: v })} placeholder="https://linkedin.com/company/namaperusahaan" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Copyright" subtitle="Teks yang tampil di bagian bawah footer website">
            <Field label="Teks Copyright">
              <TextInput value={company.copyrightText} onChange={(v) => setCompany({ ...company, copyrightText: v })} placeholder="Nama Perusahaan - All rights reserved." />
            </Field>
          </SectionCard>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving || uploadingLogo}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || uploadingLogo) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || uploadingLogo) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan Profil Perusahaan</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
