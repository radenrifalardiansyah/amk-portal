'use client'

import { useState, useEffect, useCallback } from 'react'
import Toast from '@/components/admin/Toast'
import { siteContentService } from '@/lib/services'
import type { HeroContent, AboutHomeContent, ContactContent } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
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

function SectionCard({ title, subtitle, onSave, saving, children }: {
  title: string; subtitle: string; onSave: () => void; saving: boolean; children: React.ReactNode
}) {
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px', borderTop: `1px solid ${theme.divider}` }}>
        <button onClick={onSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: saving ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
            : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
        </button>
      </div>
    </div>
  )
}

type TabKey = 'hero' | 'about' | 'contact'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'view_carousel' },
  { key: 'about', label: 'About', icon: 'info' },
  { key: 'contact', label: 'Contact', icon: 'chat' },
]

export default function HomepageContentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('hero')
  const [hero, setHero] = useState<HeroContent | null>(null)
  const [aboutHome, setAboutHome] = useState<AboutHomeContent | null>(null)
  const [contact, setContact] = useState<ContactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingHero, setSavingHero] = useState(false)
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [uploadingAboutVideo, setUploadingAboutVideo] = useState(false)
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [h, a, c] = await Promise.all([
        siteContentService.getHero(),
        siteContentService.getAboutHome(),
        siteContentService.getContact(),
      ])
      setHero(h); setAboutHome(a); setContact(c)
    } catch {
      showToast('error', 'Gagal memuat konten homepage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveHero = async () => {
    if (!hero) return
    if (!hero.badge.trim() || !hero.titleLine1.trim() || !hero.titleLine2.trim() || !hero.titleLine3.trim()) {
      showToast('error', 'Badge dan Judul Baris 1/2/3 wajib diisi')
      return
    }
    setSavingHero(true)
    try {
      await siteContentService.saveHero(hero)
      showToast('success', 'Hero berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan Hero')
    } finally {
      setSavingHero(false)
    }
  }

  const saveAbout = async () => {
    if (!aboutHome) return
    setSavingAbout(true)
    try {
      await siteContentService.saveAboutHome(aboutHome)
      showToast('success', 'About berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan About')
    } finally {
      setSavingAbout(false)
    }
  }

  const saveContact = async () => {
    if (!contact) return
    setSavingContact(true)
    try {
      await siteContentService.saveContact(contact)
      showToast('success', 'Contact berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan Contact')
    } finally {
      setSavingContact(false)
    }
  }

  const updateOption = (i: number, v: string) => {
    if (!contact) return
    const serviceOptions = [...contact.serviceOptions]
    serviceOptions[i] = v
    setContact({ ...contact, serviceOptions })
  }

  const addOption = () => {
    if (!contact) return
    setContact({ ...contact, serviceOptions: [...contact.serviceOptions, ''] })
  }

  const removeOption = (i: number) => {
    if (!contact) return
    setContact({ ...contact, serviceOptions: contact.serviceOptions.filter((_, idx) => idx !== i) })
  }

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {loading || !hero || !aboutHome || !contact ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat konten homepage...</p>
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

          {activeTab === 'hero' && (
          <SectionCard title="Hero" subtitle="Section paling atas homepage" onSave={saveHero} saving={savingHero || uploadingHeroImage}>
            <Field label="Badge *"><TextInput value={hero.badge} onChange={(v) => setHero({ ...hero, badge: v })} /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Judul Baris 1 *"><TextInput value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} /></Field>
              <Field label="Judul Baris 2 *"><TextInput value={hero.titleLine2} onChange={(v) => setHero({ ...hero, titleLine2: v })} /></Field>
              <Field label="Judul Baris 3 (gradient) *"><TextInput value={hero.titleLine3} onChange={(v) => setHero({ ...hero, titleLine3: v })} /></Field>
            </div>
            <MediaUploadField
              label="Gambar Hero" kind="image" folder="homepage/hero" aspect="aspect-[21/9]"
              value={hero.image} onChange={(url) => setHero({ ...hero, image: url })}
              onUploadingChange={setUploadingHeroImage} onError={(msg) => showToast('error', msg)}
            />
            <Field label="Deskripsi"><TextArea value={hero.description} onChange={(v) => setHero({ ...hero, description: v })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Label CTA Utama"><TextInput value={hero.primaryCtaLabel} onChange={(v) => setHero({ ...hero, primaryCtaLabel: v })} /></Field>
              <Field label="Link CTA Utama"><TextInput value={hero.primaryCtaHref} onChange={(v) => setHero({ ...hero, primaryCtaHref: v })} /></Field>
              <Field label="Label CTA Sekunder"><TextInput value={hero.secondaryCtaLabel} onChange={(v) => setHero({ ...hero, secondaryCtaLabel: v })} /></Field>
              <Field label="Link CTA Sekunder"><TextInput value={hero.secondaryCtaHref} onChange={(v) => setHero({ ...hero, secondaryCtaHref: v })} /></Field>
            </div>
          </SectionCard>
          )}

          {activeTab === 'about' && (
          <SectionCard title="About (Homepage)" subtitle="Section 'The Architects of Experience' di homepage" onSave={saveAbout} saving={savingAbout || uploadingAboutVideo || uploadingAboutImage}>
            <Field label="Heading"><TextInput value={aboutHome.heading} onChange={(v) => setAboutHome({ ...aboutHome, heading: v })} /></Field>
            <Field label="Paragraf"><TextArea value={aboutHome.paragraph} onChange={(v) => setAboutHome({ ...aboutHome, paragraph: v })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nomor Induk Berusaha"><TextInput value={aboutHome.nib} onChange={(v) => setAboutHome({ ...aboutHome, nib: v })} /></Field>
              <Field label="Alamat"><TextInput value={aboutHome.address} onChange={(v) => setAboutHome({ ...aboutHome, address: v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Statistik 1 - Nilai"><TextInput value={aboutHome.stat1Value} onChange={(v) => setAboutHome({ ...aboutHome, stat1Value: v })} /></Field>
              <Field label="Statistik 1 - Label"><TextInput value={aboutHome.stat1Label} onChange={(v) => setAboutHome({ ...aboutHome, stat1Label: v })} /></Field>
              <Field label="Statistik 2 - Nilai"><TextInput value={aboutHome.stat2Value} onChange={(v) => setAboutHome({ ...aboutHome, stat2Value: v })} /></Field>
              <Field label="Statistik 2 - Label"><TextInput value={aboutHome.stat2Label} onChange={(v) => setAboutHome({ ...aboutHome, stat2Label: v })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MediaUploadField
                label="Video" kind="video" folder="homepage/about"
                value={aboutHome.videoSrc} onChange={(url) => setAboutHome({ ...aboutHome, videoSrc: url })}
                onUploadingChange={setUploadingAboutVideo} onError={(msg) => showToast('error', msg)}
              />
              <MediaUploadField
                label="Gambar Tim" kind="image" folder="homepage/about"
                value={aboutHome.teamImage} onChange={(url) => setAboutHome({ ...aboutHome, teamImage: url })}
                onUploadingChange={setUploadingAboutImage} onError={(msg) => showToast('error', msg)}
              />
            </div>
          </SectionCard>
          )}

          {activeTab === 'contact' && (
          <SectionCard title="Contact" subtitle="Section formulir kontak & WhatsApp di homepage" onSave={saveContact} saving={savingContact}>
            <Field label="Heading"><TextInput value={contact.heading} onChange={(v) => setContact({ ...contact, heading: v })} /></Field>
            <Field label="Deskripsi"><TextArea value={contact.description} onChange={(v) => setContact({ ...contact, description: v })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nomor WhatsApp"><TextInput value={contact.waNumber} onChange={(v) => setContact({ ...contact, waNumber: v })} placeholder="62812xxxxxxx" /></Field>
              <Field label="Judul Kotak WhatsApp"><TextInput value={contact.waResponseTitle} onChange={(v) => setContact({ ...contact, waResponseTitle: v })} /></Field>
            </div>
            <Field label="Subjudul Kotak WhatsApp"><TextInput value={contact.waResponseSubtitle} onChange={(v) => setContact({ ...contact, waResponseSubtitle: v })} /></Field>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Opsi Layanan (dropdown form)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contact.serviceOptions.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ flex: 1, padding: '8px 10px', fontSize: 13, borderRadius: 8, outline: 'none', ...inputStyle }}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                    />
                    <button type="button" onClick={() => removeOption(i)}
                      style={{ padding: 8, borderRadius: 8, background: theme.dangerSoft, border: 'none', cursor: 'pointer', color: theme.danger, display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Tambah Opsi
                </button>
              </div>
            </div>
          </SectionCard>
          )}
        </div>
      )}
    </>
  )
}
