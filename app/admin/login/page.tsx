'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usersService, siteContentService } from '@/lib/services'
import type { CompanyProfile } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    siteContentService.getCompany().then(setCompany).catch(() => {})
  }, [])

  const brandName = company?.shortName || 'AMK'

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await usersService.login(email, password)
      if (!user) {
        setError('Email atau password salah. Silakan coba lagi.')
        return
      }
      usersService.saveSession(user)
      router.replace('/admin/dashboard')
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
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
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 65%)' }} />
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
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={brandName}
                style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 16 }}
              />
            ) : (
              <div style={{
                width: 60, height: 60, borderRadius: 18, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
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
                background: loading ? 'rgba(37,99,235,0.5)' : `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
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
    </div>
  )
}
