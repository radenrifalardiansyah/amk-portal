'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usersService, siteContentService, LoginApprovalPendingError } from '@/lib/services'
import type { CompanyProfile, DeviceType } from '@/lib/services'
import { theme } from '@/lib/admin-theme'
import InstallPwaCard from '@/components/admin/InstallPwaCard'
import { cloudinaryLogo } from '@/lib/cloudinary'

const APPROVAL_TIMEOUT_MS = 60_000

interface PendingApproval { requestId: string; existingDevice: DeviceType; existingLastActiveAt: string }

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const [waiting, setWaiting] = useState<PendingApproval | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(APPROVAL_TIMEOUT_MS / 1000)
  const router = useRouter()

  useEffect(() => {
    siteContentService.getCompany().then(setCompany).catch(() => {})
  }, [])

  useEffect(() => {
    if (usersService.takeKickedElsewhereFlag()) {
      setInfo('Anda otomatis keluar karena akun ini login di perangkat/browser lain.')
    }
  }, [])

  const brandName = company?.shortName || 'AMK'
  const adminLogoUrl = company?.adminLogoUrl || company?.logoUrl

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const user = await usersService.login(email, password)
      usersService.saveSession(user)
      router.replace('/admin/dashboard')
    } catch (err) {
      if (err instanceof LoginApprovalPendingError) {
        setSecondsLeft(APPROVAL_TIMEOUT_MS / 1000)
        setWaiting({
          requestId: err.requestId,
          existingDevice: err.existingDevice,
          existingLastActiveAt: err.existingLastActiveAt,
        })
        return
      }
      const code = (err as { code?: string })?.code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Email atau password salah. Silakan coba lagi.')
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi beberapa saat lagi.')
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Waits for the existing session to accept/reject this login attempt. Approval
  // finalizes via the same "force" path used previously for direct takeovers; a
  // rejection or 60s timeout with no response cancels the attempt.
  useEffect(() => {
    if (!waiting) return

    let settled = false

    const finalizeApproved = async () => {
      if (settled) return
      settled = true
      try {
        const user = await usersService.login(email, password, { force: true })
        usersService.saveSession(user)
        setWaiting(null)
        router.replace('/admin/dashboard')
      } catch {
        setWaiting(null)
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    }

    const finalizeRejected = async (message: string) => {
      if (settled) return
      settled = true
      await usersService.cancelPendingLogin()
      await usersService.clearLoginRequest(email)
      setWaiting(null)
      setError(message)
    }

    const unsubscribe = usersService.watchLoginRequest(email, (request) => {
      if (!request || request.requestId !== waiting.requestId) return
      if (request.status === 'approved') finalizeApproved()
      else if (request.status === 'rejected') finalizeRejected('Login ditolak oleh sesi yang aktif di perangkat lain.')
    })

    const timeoutId = setTimeout(() => finalizeRejected('Waktu tunggu persetujuan habis. Silakan coba lagi.'), APPROVAL_TIMEOUT_MS)
    const tickId = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)

    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
      clearInterval(tickId)
    }
  }, [waiting, email, password, router])

  const handleCancelWaiting = async () => {
    if (!waiting) return
    await usersService.cancelPendingLogin()
    await usersService.clearLoginRequest(email)
    setWaiting(null)
    setError('Login dibatalkan.')
  }

  const inputBase = {
    width: '100%', fontSize: 14, borderRadius: 14, outline: 'none',
    transition: 'all 0.2s',
    border: `1.5px solid ${theme.border}`,
    background: theme.surfaceSoft,
    color: theme.text,
    boxSizing: 'border-box' as const,
  }

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, position: 'relative', overflow: 'hidden',
        background: `radial-gradient(ellipse at 20% 20%, #EEF3FE 0%, ${theme.bg} 55%, #FFFFFF 100%)`,
      }}
    >
      {/* background orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(7,82,183,0.09) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(7,82,183,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(7,82,183,0.04) 0%, transparent 65%)' }} />
      </div>

      {/* grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.035,
        backgroundImage: `linear-gradient(${theme.text} 1px, transparent 1px), linear-gradient(90deg, ${theme.text} 1px, transparent 1px)`,
        backgroundSize: '52px 52px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div
        className="relative w-full admin-scale-in"
        style={{
          maxWidth: 420,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadowElevated,
          overflow: 'hidden',
        }}
      >
        {/* top gradient accent */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${theme.accentDark}, ${theme.accent}, transparent)` }} />

        <div style={{ padding: '36px 36px 32px' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            {adminLogoUrl ? (
              <img
                src={cloudinaryLogo(adminLogoUrl)}
                alt={brandName}
                style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 16 }}
              />
            ) : (
              <div style={{
                width: 60, height: 60, borderRadius: 18, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                boxShadow: '0 8px 32px rgba(7,82,183,0.3)',
                fontFamily: theme.fontHeadline,
              }}>
                {brandName}
              </div>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, marginBottom: 6 }}>
              Admin Portal
            </h1>
            <p style={{ fontSize: 13, color: theme.textMuted }}>{company?.legalName || 'PT. Adikara Mandala Kreasi'}</p>
          </div>

          {/* Info (e.g. kicked out elsewhere) */}
          {info && !error && (
            <div
              className="toast-enter"
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 14px', borderRadius: 14, fontSize: 13, background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`, color: theme.accentText }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>info</span>
              <span>{info}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="toast-enter"
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 14px', borderRadius: 14, fontSize: 13, background: theme.dangerSoft, border: '1px solid rgba(220,38,38,0.2)', color: theme.danger }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 19, color: theme.textMuted, pointerEvents: 'none' }}>mail</span>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amkcreative.id"
                  style={{ ...inputBase, paddingLeft: 44, paddingRight: 16, paddingTop: 13, paddingBottom: 13 }}
                  onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.background = theme.accentSoft }}
                  onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.background = theme.surfaceSoft }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.textMuted, marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 19, color: theme.textMuted, pointerEvents: 'none' }}>lock</span>
                <input
                  type={showPass ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputBase, paddingLeft: 44, paddingRight: 48, paddingTop: 13, paddingBottom: 13 }}
                  onFocus={(e) => { e.target.style.borderColor = theme.accent; e.target.style.background = theme.accentSoft }}
                  onBlur={(e) => { e.target.style.borderColor = theme.border; e.target.style.background = theme.surfaceSoft }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, display: 'flex', transition: 'color 0.15s', padding: 2 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textSecondary }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = theme.textMuted }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 600, color: '#fff',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
                background: loading ? 'rgba(7,82,183,0.5)' : `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(7,82,183,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full admin-spin" /><span>Memverifikasi...</span></>
              ) : (
                <><span>Masuk ke Dashboard</span><span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_forward</span></>
              )}
            </button>
          </form>

          <InstallPwaCard />

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link href="/"
              style={{ fontSize: 12, color: theme.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = theme.textSecondary }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = theme.textMuted }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
              Kembali ke Website
            </Link>
          </div>
        </div>
      </div>

      {/* Waiting for Approval Modal */}
      {waiting && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(16,24,40,0.45)', backdropFilter: 'blur(4px)', padding: 16,
          }}
          className="admin-modal-backdrop"
        >
          <div
            style={{
              width: '100%', maxWidth: 380, padding: 24, borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
              boxShadow: theme.shadowElevated,
            }}
            className="admin-modal-card"
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.accentSoft,
            }}>
              <span className="w-5 h-5 border-2 rounded-full admin-spin" style={{ borderColor: theme.accentSoftBorder, borderTopColor: theme.accent }} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, marginBottom: 6 }}>
              Menunggu Persetujuan
            </h2>
            <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5, marginBottom: 22 }}>
              Akun ini sedang aktif di perangkat <strong>{waiting.existingDevice === 'mobile' ? 'Mobile' : 'Desktop'}</strong> lain
              (terakhir aktif {new Date(waiting.existingLastActiveAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}).
              Menunggu sesi tersebut menerima atau menolak permintaan login ini ({secondsLeft}s).
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelWaiting}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${theme.border}`, background: theme.surface,
                  color: theme.textSecondary, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-modal-backdrop { animation: admin-modal-fade 0.15s ease; }
        .admin-modal-card { animation: admin-modal-pop 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes admin-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes admin-modal-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
