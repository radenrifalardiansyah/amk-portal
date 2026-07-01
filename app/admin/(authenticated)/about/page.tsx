'use client'

import { useState, useEffect, useCallback } from 'react'
import Toast from '@/components/admin/Toast'
import Pagination from '@/components/admin/Pagination'
import { siteContentService } from '@/lib/services'
import type { AboutPageContent } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'

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

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className={inputCls} style={inputStyle} value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
    />
  )
}

function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      rows={rows} className={inputCls} style={{ ...inputStyle, resize: 'none' }} value={value}
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

const LIST_PAGE_SIZE = 5

type TabKey = 'hero' | 'vision' | 'mission' | 'units'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: 'view_carousel' },
  { key: 'vision', label: 'Visi', icon: 'visibility' },
  { key: 'mission', label: 'Misi', icon: 'flag' },
  { key: 'units', label: 'Unit Bisnis', icon: 'apartment' },
]

export default function AboutPageContentAdmin() {
  const [activeTab, setActiveTab] = useState<TabKey>('hero')
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [missionPage, setMissionPage] = useState(1)
  const [unitPage, setUnitPage] = useState(1)

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchContent = useCallback(async () => {
    setLoading(true)
    try {
      setContent(await siteContentService.getAboutPage())
    } catch {
      showToast('error', 'Gagal memuat konten halaman About')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContent() }, [fetchContent])

  const handleSave = async () => {
    if (!content) return
    setSaving(true)
    try {
      await siteContentService.saveAboutPage(content)
      showToast('success', 'Halaman About berhasil disimpan!')
    } catch {
      showToast('error', 'Gagal menyimpan halaman About')
    } finally {
      setSaving(false)
    }
  }

  const updateMission = (i: number, v: string) => {
    if (!content) return
    const missions = [...content.missions]
    missions[i] = v
    setContent({ ...content, missions })
  }

  const addMission = () => {
    if (!content) return
    const missions = [...content.missions, '']
    setContent({ ...content, missions })
    setMissionPage(Math.ceil(missions.length / LIST_PAGE_SIZE))
  }

  const removeMission = (i: number) => {
    if (!content) return
    const missions = content.missions.filter((_, idx) => idx !== i)
    setContent({ ...content, missions })
    setMissionPage((p) => Math.min(p, Math.max(1, Math.ceil(missions.length / LIST_PAGE_SIZE))))
  }

  const updateUnit = (i: number, key: 'code' | 'title' | 'desc', v: string) => {
    if (!content) return
    const businessUnits = [...content.businessUnits]
    businessUnits[i] = { ...businessUnits[i], [key]: v }
    setContent({ ...content, businessUnits })
  }

  const addUnit = () => {
    if (!content) return
    const businessUnits = [...content.businessUnits, { code: '', title: '', desc: '' }]
    setContent({ ...content, businessUnits })
    setUnitPage(Math.ceil(businessUnits.length / LIST_PAGE_SIZE))
  }

  const removeUnit = (i: number) => {
    if (!content) return
    const businessUnits = content.businessUnits.filter((_, idx) => idx !== i)
    setContent({ ...content, businessUnits })
    setUnitPage((p) => Math.min(p, Math.max(1, Math.ceil(businessUnits.length / LIST_PAGE_SIZE))))
  }

  return (
    <>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      {loading || !content ? (
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

          {activeTab === 'vision' && (
          <SectionCard title="Visi" subtitle="Bagian visi perusahaan">
            <Field label="Judul"><TextInput value={content.visionTitle} onChange={(v) => setContent({ ...content, visionTitle: v })} /></Field>
            <Field label="Teks Visi"><TextArea rows={4} value={content.visionText} onChange={(v) => setContent({ ...content, visionText: v })} /></Field>
          </SectionCard>
          )}

          {activeTab === 'mission' && (
          <SectionCard title="Misi" subtitle="Bagian misi perusahaan">
            <Field label="Judul"><TextInput value={content.missionTitle} onChange={(v) => setContent({ ...content, missionTitle: v })} /></Field>
            <Field label="Pengantar Misi"><TextArea value={content.missionIntro} onChange={(v) => setContent({ ...content, missionIntro: v })} /></Field>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Daftar Misi</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {content.missions
                  .map((m, idx) => ({ m, idx }))
                  .slice((missionPage - 1) * LIST_PAGE_SIZE, missionPage * LIST_PAGE_SIZE)
                  .map(({ m, idx }) => (
                  <div key={idx} style={{ padding: 12, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Misi {idx + 1}</span>
                      <button type="button" onClick={() => removeMission(idx)}
                        style={{ padding: 6, borderRadius: 8, background: theme.dangerSoft, border: 'none', cursor: 'pointer', color: theme.danger, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
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
                <button type="button" onClick={addMission}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Tambah Misi
                </button>
                <Pagination page={missionPage} pageSize={LIST_PAGE_SIZE} totalItems={content.missions.length} onPageChange={setMissionPage} />
              </div>
            </div>
          </SectionCard>
          )}

          {activeTab === 'units' && (
          <SectionCard title="Unit Bisnis" subtitle="Daftar unit bisnis / klasifikasi KLBI">
            <Field label="Judul"><TextInput value={content.businessUnitsTitle} onChange={(v) => setContent({ ...content, businessUnitsTitle: v })} /></Field>
            <Field label="Pengantar"><TextArea value={content.businessUnitsIntro} onChange={(v) => setContent({ ...content, businessUnitsIntro: v })} /></Field>
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Daftar Unit Bisnis</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {content.businessUnits
                  .map((unit, idx) => ({ unit, idx }))
                  .slice((unitPage - 1) * LIST_PAGE_SIZE, unitPage * LIST_PAGE_SIZE)
                  .map(({ unit, idx }) => (
                  <div key={idx} style={{ padding: 12, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Unit {idx + 1}</span>
                      <button type="button" onClick={() => removeUnit(idx)}
                        style={{ padding: 6, borderRadius: 8, background: theme.dangerSoft, border: 'none', cursor: 'pointer', color: theme.danger, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 8 }}>
                      <input
                        style={{ padding: '8px 10px', fontSize: 13, borderRadius: 8, outline: 'none', ...inputStyle }}
                        value={unit.code} placeholder="Kode KLBI"
                        onChange={(e) => updateUnit(idx, 'code', e.target.value)}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                      />
                      <input
                        style={{ gridColumn: 'span 2', padding: '8px 10px', fontSize: 13, borderRadius: 8, outline: 'none', ...inputStyle }}
                        value={unit.title} placeholder="Judul unit bisnis"
                        onChange={(e) => updateUnit(idx, 'title', e.target.value)}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                      />
                    </div>
                    <textarea rows={2}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, outline: 'none', resize: 'none', boxSizing: 'border-box', ...inputStyle }}
                      value={unit.desc} placeholder="Deskripsi singkat"
                      onChange={(e) => updateUnit(idx, 'desc', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                      onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
                    />
                  </div>
                ))}
                <button type="button" onClick={addUnit}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Tambah Unit Bisnis
                </button>
                <Pagination page={unitPage} pageSize={LIST_PAGE_SIZE} totalItems={content.businessUnits.length} onPageChange={setUnitPage} />
              </div>
            </div>
          </SectionCard>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: saving ? 'rgba(37,99,235,0.5)' : theme.accent, boxShadow: saving ? 'none' : '0 2px 12px rgba(37,99,235,0.25)' }}>
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
