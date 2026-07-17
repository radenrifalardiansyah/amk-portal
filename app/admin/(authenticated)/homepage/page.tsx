'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { siteContentService } from '@/lib/services'
import type { HeroContent, ContactContent, AboutPageContent } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import SearchSelect from '@/components/admin/SearchSelect'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'

const LIST_PAGE_SIZE = 5

interface ToastState { type: 'success' | 'error' | 'info'; message: string }

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all'
const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 6 }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{hint}</p>}
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

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <SearchSelect
      value={value}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      onChange={onChange}
      allowClear={false}
    />
  )
}

const HERO_TITLE_SIZE_OPTIONS = [
  { label: 'Kecil', value: 'text-4xl md:text-5xl' },
  { label: 'Sedang', value: 'text-5xl md:text-6xl' },
  { label: 'Besar', value: 'text-6xl md:text-7xl' },
  { label: 'Sangat Besar (Default)', value: 'text-6xl md:text-8xl' },
  { label: 'Ekstra Besar', value: 'text-7xl md:text-9xl' },
]

function SectionCard({ title, subtitle, onSave, saving, canEdit, children }: {
  title: string; subtitle: string; onSave: () => void; saving: boolean; canEdit: boolean; children: React.ReactNode
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
        <button onClick={onSave} disabled={saving || !canEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || !canEdit) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || !canEdit) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
            : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan</>}
        </button>
      </div>
    </div>
  )
}

type TabKey = 'hero' | 'vision' | 'contact'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'view_carousel' },
  { key: 'vision', label: 'Visi & Misi', icon: 'flag' },
  { key: 'contact', label: 'Contact', icon: 'chat' },
]

export default function HomepageContentPage() {
  const { edit, delete: canDelete } = usePermission('homepage')
  const [activeTab, setActiveTab] = useState<TabKey>('hero')
  const { data: heroData, isLoading: heroLoading, mutate: mutateHero } = useSWR('hero', siteContentService.getHero)
  const { data: aboutPageData, isLoading: aboutPageLoading, mutate: mutateAboutPage } = useSWR('aboutPage', siteContentService.getAboutPage)
  const { data: contactData, isLoading: contactLoading, mutate: mutateContact } = useSWR('contact', siteContentService.getContact)
  const [hero, setHero] = useState<HeroContent | null>(null)
  const [aboutPage, setAboutPage] = useState<AboutPageContent | null>(null)
  const [contact, setContact] = useState<ContactContent | null>(null)
  const loading = heroLoading || aboutPageLoading || contactLoading
  const [savingHero, setSavingHero] = useState(false)
  const [savingVision, setSavingVision] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [missionPage, setMissionPage] = useState(1)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (heroData && !hero) setHero(heroData)
  }, [heroData, hero])

  useEffect(() => {
    if (aboutPageData && !aboutPage) setAboutPage(aboutPageData)
  }, [aboutPageData, aboutPage])

  useEffect(() => {
    if (contactData && !contact) setContact(contactData)
  }, [contactData, contact])

  const saveHero = async () => {
    if (!edit) return
    if (!hero) return
    if (!hero.badge.trim() || !hero.titleLine1.trim() || !hero.titleLine2.trim() || !hero.titleLine3.trim()) {
      showToast('error', 'Badge dan Judul Baris 1/2/3 wajib diisi')
      return
    }
    setSavingHero(true)
    try {
      await siteContentService.saveHero(hero)
      await mutateHero(hero, false)
      showToast('success', 'Hero berhasil disimpan!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan Hero')
    } finally {
      setSavingHero(false)
    }
  }

  const saveVision = async () => {
    if (!edit) return
    if (!aboutPage) return
    setSavingVision(true)
    try {
      await siteContentService.saveAboutPage(aboutPage)
      await mutateAboutPage(aboutPage, false)
      showToast('success', 'Visi & Misi berhasil disimpan!')
      revalidatePaths(['/'])
    } catch {
      showToast('error', 'Gagal menyimpan Visi & Misi')
    } finally {
      setSavingVision(false)
    }
  }

  const updateMission = (i: number, v: string) => {
    if (!aboutPage) return
    const missions = [...aboutPage.missions]
    missions[i] = v
    setAboutPage({ ...aboutPage, missions })
  }

  const addMission = () => {
    if (!aboutPage) return
    const missions = [...aboutPage.missions, '']
    setAboutPage({ ...aboutPage, missions })
    setMissionPage(Math.ceil(missions.length / LIST_PAGE_SIZE))
  }

  const removeMission = (i: number) => {
    if (!aboutPage) return
    const missions = aboutPage.missions.filter((_, idx) => idx !== i)
    setAboutPage({ ...aboutPage, missions })
    setMissionPage((p) => Math.min(p, Math.max(1, Math.ceil(missions.length / LIST_PAGE_SIZE))))
  }

  const saveContact = async () => {
    if (!edit) return
    if (!contact) return
    setSavingContact(true)
    try {
      await siteContentService.saveContact(contact)
      await mutateContact(contact, false)
      showToast('success', 'Contact berhasil disimpan!')
      revalidatePaths([{ path: '/', type: 'layout' }])
    } catch {
      showToast('error', 'Gagal menyimpan Contact')
    } finally {
      setSavingContact(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {loading || !hero || !aboutPage || !contact ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat konten homepage...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}`, width: 'fit-content' }}>
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
          <SectionCard title="Hero" subtitle="Section paling atas homepage" onSave={saveHero} saving={savingHero || uploadingHeroImage} canEdit={edit}>
            <Field label="Badge *"><TextInput value={hero.badge} onChange={(v) => setHero({ ...hero, badge: v })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Judul Baris 1 *"><TextInput value={hero.titleLine1} onChange={(v) => setHero({ ...hero, titleLine1: v })} /></Field>
              <Field label="Judul Baris 2 *"><TextInput value={hero.titleLine2} onChange={(v) => setHero({ ...hero, titleLine2: v })} /></Field>
              <Field label="Judul Baris 3 (gradient) *"><TextInput value={hero.titleLine3} onChange={(v) => setHero({ ...hero, titleLine3: v })} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Ukuran Font Baris 1"><Select value={hero.titleLine1Size} onChange={(v) => setHero({ ...hero, titleLine1Size: v })} options={HERO_TITLE_SIZE_OPTIONS} /></Field>
              <Field label="Ukuran Font Baris 2"><Select value={hero.titleLine2Size} onChange={(v) => setHero({ ...hero, titleLine2Size: v })} options={HERO_TITLE_SIZE_OPTIONS} /></Field>
              <Field label="Ukuran Font Baris 3"><Select value={hero.titleLine3Size} onChange={(v) => setHero({ ...hero, titleLine3Size: v })} options={HERO_TITLE_SIZE_OPTIONS} /></Field>
            </div>
            <MediaUploadField
              label="Gambar Hero" folder="homepage/hero" aspect="aspect-[21/9]"
              value={hero.image} onChange={(url) => setHero({ ...hero, image: url })}
              onUploadingChange={setUploadingHeroImage} onError={(msg) => showToast('error', msg)}
            />
            <Field label="Deskripsi"><TextArea value={hero.description} onChange={(v) => setHero({ ...hero, description: v })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Label CTA Utama"><TextInput value={hero.primaryCtaLabel} onChange={(v) => setHero({ ...hero, primaryCtaLabel: v })} /></Field>
              <Field label="Link CTA Utama"><TextInput value={hero.primaryCtaHref} onChange={(v) => setHero({ ...hero, primaryCtaHref: v })} /></Field>
              <Field label="Label CTA Sekunder"><TextInput value={hero.secondaryCtaLabel} onChange={(v) => setHero({ ...hero, secondaryCtaLabel: v })} /></Field>
              <Field label="Link CTA Sekunder"><TextInput value={hero.secondaryCtaHref} onChange={(v) => setHero({ ...hero, secondaryCtaHref: v })} /></Field>
            </div>
          </SectionCard>
          )}

          {activeTab === 'vision' && (
          <SectionCard title="Visi & Misi" subtitle="Bagian visi & misi perusahaan di halaman utama" onSave={saveVision} saving={savingVision} canEdit={edit}>
            <Field label="Judul Visi"><TextInput value={aboutPage.visionTitle} onChange={(v) => setAboutPage({ ...aboutPage, visionTitle: v })} /></Field>
            <Field label="Teks Visi"><TextArea rows={4} value={aboutPage.visionText} onChange={(v) => setAboutPage({ ...aboutPage, visionText: v })} /></Field>
            <Field label="Judul Misi"><TextInput value={aboutPage.missionTitle} onChange={(v) => setAboutPage({ ...aboutPage, missionTitle: v })} /></Field>
            <Field label="Pengantar Misi"><TextArea value={aboutPage.missionIntro} onChange={(v) => setAboutPage({ ...aboutPage, missionIntro: v })} /></Field>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Daftar Misi</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {aboutPage.missions
                  .map((m, idx) => ({ m, idx }))
                  .slice((missionPage - 1) * LIST_PAGE_SIZE, missionPage * LIST_PAGE_SIZE)
                  .map(({ m, idx }) => (
                  <div key={idx} style={{ padding: 12, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Misi {idx + 1}</span>
                      {canDelete && (
                      <button type="button" onClick={() => removeMission(idx)}
                        style={{ padding: 6, borderRadius: 8, background: theme.dangerSoft, border: 'none', cursor: 'pointer', color: theme.danger, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
                      )}
                    </div>
                    <textarea rows={2}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, outline: 'none', resize: 'none', boxSizing: 'border-box', ...inputStyle }}
                      value={m}
                      onChange={(e) => updateMission(idx, e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                    />
                  </div>
                ))}
                {edit && (
                <button type="button" onClick={addMission}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Tambah Misi
                </button>
                )}
                <Pagination page={missionPage} pageSize={LIST_PAGE_SIZE} totalItems={aboutPage.missions.length} onPageChange={setMissionPage} />
              </div>
            </div>
          </SectionCard>
          )}

          {activeTab === 'contact' && (
          <SectionCard title="Contact" subtitle="Section formulir kontak & WhatsApp di homepage" onSave={saveContact} saving={savingContact} canEdit={edit}>
            <Field label="Heading"><TextInput value={contact.heading} onChange={(v) => setContact({ ...contact, heading: v })} /></Field>
            <Field label="Deskripsi"><TextArea value={contact.description} onChange={(v) => setContact({ ...contact, description: v })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nomor WhatsApp" hint="Khusus tombol WA di section Contact ini. Nomor WA di footer diatur terpisah di halaman Company Profile (nomor ini dipakai sebagai fallback jika kolom di sana kosong).">
                <TextInput value={contact.waNumber} onChange={(v) => setContact({ ...contact, waNumber: v })} placeholder="62812xxxxxxx" />
              </Field>
              <Field label="Judul Kotak WhatsApp"><TextInput value={contact.waResponseTitle} onChange={(v) => setContact({ ...contact, waResponseTitle: v })} /></Field>
            </div>
            <Field label="Subjudul Kotak WhatsApp"><TextInput value={contact.waResponseSubtitle} onChange={(v) => setContact({ ...contact, waResponseSubtitle: v })} /></Field>
            <Field label="Link Google Form" hint="Buka Google Form → Send → tab <> Embed HTML, salin URL di dalam src=&quot;...&quot;. Formulir ini yang tampil di section Contact halaman utama.">
              <TextInput value={contact.googleFormUrl} onChange={(v) => setContact({ ...contact, googleFormUrl: v })} placeholder="https://docs.google.com/forms/d/e/xxx/viewform?embedded=true" />
            </Field>
            <Field label="Template Pesan WhatsApp" hint="Pesan ini otomatis terisi saat pengunjung klik tombol/link WhatsApp di section Contact maupun Footer.">
              <TextArea value={contact.waMessageTemplate} onChange={(v) => setContact({ ...contact, waMessageTemplate: v })} />
            </Field>
          </SectionCard>
          )}
        </div>
      )}
    </>
  )
}
