'use client'

import { Fragment, useState } from 'react'
import useSWR from 'swr'
import { cronLogsService } from '@/lib/services'
import type { CronLog } from '@/lib/services'
import { theme, inputStyle, inputFocusStyle, inputBlurStyle } from '@/lib/admin-theme'
import StatCard from '@/components/admin/StatCard'
import Pagination from '@/components/admin/Pagination'

const formatDate = (iso: string) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' })

const statusStyle = (status: CronLog['status']) => status === 'success'
  ? { background: theme.accentSoft, color: theme.accentText, border: `1px solid ${theme.accentSoftBorder}` }
  : { background: theme.dangerSoft, color: theme.danger, border: '1px solid rgba(220,38,38,0.18)' }

export default function CronLogsPage() {
  const { data: logs = [], isLoading: loading } = useSWR('cron-logs', () => cronLogsService.getAll(), { refreshInterval: 60000 })
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pageSize = 12

  const successCount = logs.filter((l) => l.status === 'success').length
  const errorCount = logs.filter((l) => l.status === 'error').length

  const filtered = logs.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return formatDate(l.ranAt).toLowerCase().includes(q)
      || (l.status === 'success' ? 'berhasil' : 'gagal').includes(q)
      || l.dueSlugs.some((s) => s.toLowerCase().includes(q))
      || (l.error ?? '').toLowerCase().includes(q)
  })
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard title="Total Run" value={logs.length} icon="history" />
        <StatCard title="Berhasil" value={successCount} icon="check_circle" />
        <StatCard title="Gagal" value={errorCount} icon="error" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: theme.textMuted, pointerEvents: 'none' }}>search</span>
          <input
            type="text" placeholder="Cari riwayat cron..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full outline-none text-sm rounded-xl transition-all"
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9 }}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBlurStyle)}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 4, borderRadius: 12, background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setPage(1) }}
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: view === v ? theme.accentSoftHover : 'transparent', color: view === v ? theme.accentText : theme.textMuted, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{v === 'grid' ? 'grid_view' : 'table_rows'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat riwayat cron...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>history</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>{search ? 'Tidak ditemukan' : 'Belum ada riwayat cron'}</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{search ? 'Coba keyword lain' : 'Log akan muncul setelah GitHub Actions menjalankan cron pertama kali'}</p>
          </div>
        </div>
      ) : view === 'grid' ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {paginated.map((log, i) => (
            <div key={log.id}
              className="rounded-2xl overflow-hidden admin-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.2s, border-color 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.borderHover; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCardHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.border; (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadowCard }}
            >
              <div style={{ padding: '18px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: theme.accent }}>history</span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...statusStyle(log.status) }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{log.status === 'success' ? 'check_circle' : 'error'}</span>
                    {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, color: theme.text, marginBottom: 4, lineHeight: 1.3, fontFamily: theme.fontHeadline, fontSize: 13.5 }}>{formatDate(log.ranAt)}</h3>
                <p style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14 }}>
                  {log.status === 'error' ? log.error : log.dueSlugs.length === 0 ? 'Tidak ada artikel due' : `${log.dueSlugs.length} artikel direvalidate`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, borderTop: `1px solid ${theme.divider}` }}>
                  <span style={{ fontSize: 11.5, color: theme.textMuted }}>{log.durationMs}ms</span>
                  {log.status === 'success' && log.dueSlugs.length > 0 && (
                    <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 600, color: theme.accentText, background: theme.accentSoft, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoftHover }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.accentSoft }}>
                      {expanded === log.id ? 'Tutup' : 'Detail'}
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{expanded === log.id ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  )}
                </div>
                {expanded === log.id && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.divider}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {log.revalidatedPaths.map((p) => (
                      <span key={p} style={{ padding: '3px 9px', borderRadius: 7, fontSize: 11, background: theme.surfaceSoft, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
        </>
      ) : (
        <>
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, boxShadow: theme.shadowCard, overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                  {['Waktu', 'Status', 'Durasi', 'Artikel Direvalidate', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 sm:px-5 sm:py-2.5" style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, background: theme.surfaceSoft, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((log) => (
                  <Fragment key={log.id}>
                  <tr style={{ borderBottom: `1px solid ${theme.divider}` }} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3" style={{ color: theme.textSecondary, fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(log.ranAt)}</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ...statusStyle(log.status) }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{log.status === 'success' ? 'check_circle' : 'error'}</span>
                        {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3" style={{ color: theme.textMuted, fontSize: 12.5, whiteSpace: 'nowrap' }}>{log.durationMs}ms</td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3" style={{ color: theme.textSecondary, fontSize: 12.5 }}>
                      {log.status === 'error'
                        ? <span style={{ color: theme.danger }}>{log.error}</span>
                        : log.dueSlugs.length === 0
                          ? <span style={{ color: theme.textMuted }}>Tidak ada artikel due</span>
                          : `${log.dueSlugs.length} artikel`}
                    </td>
                    <td className="px-3 py-2.5 sm:px-5 sm:py-3">
                      {log.status === 'success' && log.dueSlugs.length > 0 && (
                        <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{expanded === log.id ? 'expand_less' : 'expand_more'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr style={{ borderBottom: `1px solid ${theme.divider}` }}>
                      <td colSpan={5} className="px-3 py-3 sm:px-5" style={{ background: theme.surfaceSoft }}>
                        <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.textMuted, marginBottom: 8 }}>Path yang direvalidate</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {log.revalidatedPaths.map((p) => (
                            <span key={p} style={{ padding: '3px 9px', borderRadius: 7, fontSize: 11.5, background: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>{p}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
