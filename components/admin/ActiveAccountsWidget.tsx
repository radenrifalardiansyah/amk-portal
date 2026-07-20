'use client'

import { useEffect, useRef, useState } from 'react'
import { usersService, isSessionActive } from '@/lib/services'
import type { AdminUser, SessionUser } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  return `${hours} jam lalu`
}

export default function ActiveAccountsWidget({ session, canKick }: { session: SessionUser; canKick: boolean }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [open, setOpen] = useState(false)
  const [kickTarget, setKickTarget] = useState<string | null>(null)
  const [kicking, setKicking] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => usersService.watchUsers(setUsers), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeUsers = users
    .filter((u) => isSessionActive(u.activeSession))
    .sort((a, b) => new Date(b.activeSession!.lastActiveAt).getTime() - new Date(a.activeSession!.lastActiveAt).getTime())

  const handleKick = async (email: string) => {
    setKicking(email)
    try {
      await usersService.kick(email)
    } finally {
      setKicking(null)
      setKickTarget(null)
    }
  }

  return (
    <div ref={rootRef} className="fixed z-40 bottom-[88px] lg:bottom-6" style={{ right: 16 }}>
      <div style={{ position: 'relative' }}>
        {open && (
          <div
            className="admin-modal-card"
            style={{
              position: 'absolute', bottom: 'calc(100% + 12px)', right: 0, width: 300, maxHeight: 420,
              display: 'flex', flexDirection: 'column',
              background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 16,
              boxShadow: theme.shadowElevated, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.accentSoft,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: theme.accent }}>group</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>Akun Aktif</p>
                <p style={{ fontSize: 11, color: theme.textMuted }}>{activeUsers.length} sedang login</p>
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: 8 }}>
              {activeUsers.length === 0 && (
                <p style={{ fontSize: 12, color: theme.textMuted, padding: '12px 8px', textAlign: 'center' }}>Tidak ada akun yang aktif.</p>
              )}
              {activeUsers.map((u) => {
                const isSelf = u.email === session.email
                const confirming = kickTarget === u.email
                return (
                  <div key={u.email} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 10,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0, position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                    }}>
                      {(u.name || u.email)[0].toUpperCase()}
                      <span style={{
                        position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%',
                        background: '#22C55E', border: `2px solid ${theme.surface}`,
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name || u.email}{isSelf && ' (Anda)'}
                      </p>
                      <p style={{ fontSize: 10.5, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.activeSession!.device === 'mobile' ? 'Mobile' : 'Desktop'} · {relativeTime(u.activeSession!.lastActiveAt)}
                      </p>
                    </div>
                    {canKick && !isSelf && (
                      confirming ? (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => handleKick(u.email)}
                            disabled={kicking === u.email}
                            title="Konfirmasi keluarkan"
                            style={{ color: '#fff', background: theme.danger, border: 'none', borderRadius: 8, padding: '5px 8px', fontSize: 10.5, fontWeight: 600, cursor: kicking === u.email ? 'not-allowed' : 'pointer' }}
                          >
                            {kicking === u.email ? '...' : 'Yakin?'}
                          </button>
                          <button
                            onClick={() => setKickTarget(null)}
                            title="Batal"
                            style={{ color: theme.textMuted, background: 'none', border: 'none', padding: '5px', cursor: 'pointer', display: 'flex' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setKickTarget(u.email)}
                          title="Keluarkan akun ini"
                          style={{ color: theme.danger, background: theme.dangerSoft, border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          title="Akun aktif"
          style={{
            position: 'relative', width: 50, height: 50, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
            boxShadow: '0 8px 20px rgba(7,82,183,0.35)', color: '#fff', transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
          {activeUsers.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19, padding: '0 4px', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#22C55E', color: '#fff', fontSize: 10.5, fontWeight: 700,
              border: `2px solid ${theme.bg}`,
            }}>
              {activeUsers.length}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
