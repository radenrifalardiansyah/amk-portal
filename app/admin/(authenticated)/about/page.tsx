'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Toast from '@/components/admin/Toast'
import { siteContentService } from '@/lib/services'
import type { AboutPageContent, AboutHomeContent } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { revalidatePaths } from '@/lib/revalidate'
import { usePermission } from '@/lib/permissions'

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

type TabKey = 'hero' | 'about'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'view_carousel' },
  { key: 'about', label: 'About', icon: 'info' },
]

export default function AboutPageContentAdmin() {
  const { edit } = usePermission('about')
  const [activeTab, setActiveTab] = useState<TabKey>('hero')
  const { data: aboutPageData, isLoading: aboutPageLoading, mutate } = useSWR('aboutPage', siteContentService.getAboutPage)
  const { data: aboutHomeData, isLoading: aboutHomeLoading, mutate: mutateAboutHome } = useSWR('aboutHome', siteContentService.getAboutHome)
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [aboutHome, setAboutHome] = useState<AboutHomeContent | null>(null)
  const loading = aboutPageLoading || aboutHomeLoading
  const [saving, setSaving] = useState(false)
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    if (aboutPageData && !content) setContent(aboutPageData)
  }, [aboutPageData, content])

  useEffect(() => {
    if (aboutHomeData && !aboutHome) setAboutHome(aboutHomeData)
  }, [aboutHomeData, aboutHome])

  const handleSave = async () => {
    if (!edit) return
    if (!content || !aboutHome) return
    setSaving(true)
    try {
      await Promise.all([
        siteContentService.saveAboutPage(content),
        siteContentService.saveAboutHome(aboutHome),
      ])
      await mutate(content, false)
      await mutateAboutHome(aboutHome, false)
      showToast('success', 'Halaman About berhasil disimpan!')
      revalidatePaths(['/about'])
    } catch {
      showToast('error', 'Gagal menyimpan halaman About')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {loading || !content || !aboutHome ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat konten halaman About...</p>
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
          <SectionCard title="Hero" subtitle="Bagian atas halaman /about">
            <Field label="Badge"><TextInput value={content.badge} onChange={(v) => setContent({ ...content, badge: v })} /></Field>
            <Field label="Judul"><TextInput value={content.heroTitle} onChange={(v) => setContent({ ...content, heroTitle: v })} /></Field>
            <Field label="Deskripsi"><TextArea value={content.heroDescription} onChange={(v) => setContent({ ...content, heroDescription: v })} /></Field>
          </SectionCard>
          )}

          {activeTab === 'about' && (
          <SectionCard title="About" subtitle="Section 'The Architects of Experience' di halaman /about">
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
              <Field label="URL Video (link .mp4)">
                <TextInput
                  value={aboutHome.videoSrc}
                  onChange={(v) => setAboutHome({ ...aboutHome, videoSrc: v })}
                  placeholder="https://.../video.mp4"
                />
              </Field>
              <MediaUploadField
                label="Gambar Tim" folder="homepage/about"
                value={aboutHome.teamImage} onChange={(url) => setAboutHome({ ...aboutHome, teamImage: url })}
                onUploadingChange={setUploadingAboutImage} onError={(msg) => showToast('error', msg)}
              />
            </div>
          </SectionCard>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving || !edit || uploadingAboutImage}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: (saving || !edit || uploadingAboutImage) ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: (saving || !edit || uploadingAboutImage) ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" />Menyimpan...</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>save</span>Simpan Semua</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
