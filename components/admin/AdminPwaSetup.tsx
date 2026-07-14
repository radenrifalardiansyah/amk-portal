'use client'

import { useEffect, useState } from 'react'
import { theme } from '@/lib/admin-theme'

// Detects whether the admin panel is running as an installed PWA (Android "standalone"
// display mode, or iOS's older `navigator.standalone` flag) rather than a normal browser tab.
function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}

export default function AdminPwaSetup({ logoUrl }: { logoUrl?: string }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!isRunningStandalone()) return
    setShowSplash(true)
    // Keep the splash up briefly so it reads as an intentional launch screen instead of a flash,
    // but never longer than needed once the app has actually finished loading.
    const minDuration = new Promise((resolve) => setTimeout(resolve, 900))
    const pageLoaded = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }))
    Promise.all([minDuration, pageLoaded]).then(() => setShowSplash(false))
  }, [])

  if (!showSplash) return null

  return (
    <div
      role="status"
      aria-label="Memuat aplikasi"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, background: '#FFFFFF',
      }}
      className="admin-splash-fade"
    >
      <img src={logoUrl || '/icons/icon-192.png'} alt="AMK Admin" style={{ width: 88, height: 88, borderRadius: 20, objectFit: 'contain' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, letterSpacing: '0.01em' }}>
          AMK Admin Portal
        </p>
        <span className="w-5 h-5 border-2 border-black/10 rounded-full admin-spin" style={{ borderTopColor: theme.accent }} />
      </div>
      <style>{`
        .admin-splash-fade { animation: admin-splash-in 0.15s ease; }
        @keyframes admin-splash-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
