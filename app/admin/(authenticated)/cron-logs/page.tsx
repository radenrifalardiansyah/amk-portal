'use client'

import { Fragment, useState } from 'react'
import useSWR from 'swr'
import { cronLogsService } from '@/lib/services'
import type { CronLog } from '@/lib/services'
import { theme } from '@/lib/admin-theme'
import Pagination from '@/components/admin/Pagination'

const formatDate = (iso: string) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' })

const statusStyle = (status: CronLog['status']) => status === 'success'
  ? { background: theme.accentSoft, color: theme.accentText, border: `1px solid ${theme.accentSoftBorder}` }
  : { background: theme.dangerSoft, color: theme.danger, border: '1px solid rgba(220,38,38,0.18)' }

export default function CronLogsPage() {
  const { data: logs = [], isLoading: loading } = useSWR('cron-logs', () => cronLogsService.getAll(), { refreshInterval: 60000 })
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pageSize = 15

  const paginated = logs.slice((page - 1) * pageSize, page * pageSize)
  const successCount = logs.filter((l) => l.status === 'success').length
  const errorCount = logs.filter((l) => l.status === 'error').length

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
        {[
          { label: 'Total Run', value: logs.length, icon: 'history', color: theme.textSecondary },
          { label: 'Berhasil', value: successCount, icon: 'check_circle', color: theme.accentText },
          { label: 'Gagal', value: errorCount, icon: 'error', color: theme.danger },
        ].map((s) => (
          <div key={s.label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '16px 18px', boxShadow: theme.shadowCard }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 12.5, color: theme.textMuted }}>
          Riwayat eksekusi cron <code style={{ background: theme.surfaceSoft, padding: '2px 6px', borderRadius: 6 }}>revalidate-scheduled</code>, dijalankan via GitHub Actions setiap hari jam 00:00 WIB.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <div className="w-7 h-7 border-4 rounded-full admin-spin" style={{ borderColor: theme.divider, borderTopColor: theme.accent }} />
          <p style={{ fontSize: 13, color: theme.textMuted }}>Memuat riwayat cron...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.surfaceSoft, border: `1px solid ${theme.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.textMuted }}>history</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>Belum ada riwayat cron</p>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Log akan muncul setelah GitHub Actions menjalankan cron pertama kali</p>
          </div>
        </div>
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
        <Pagination page={page} pageSize={pageSize} totalItems={logs.length} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
