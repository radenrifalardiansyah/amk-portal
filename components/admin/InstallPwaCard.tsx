'use client'

import { useEffect, useState } from 'react'
import { theme } from '@/lib/admin-theme'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}

function isIos(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ masquerades as Mac Safari but exposes multi-touch, unlike a real Mac.
  const isIpadOs13 = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return isAppleTouch || isIpadOs13
}

export default function InstallPwaCard() {
  const [standalone, setStandalone] = useState(true)
  const [ios, setIos] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [justInstalled, setJustInstalled] = useState(false)

  useEffect(() => {
    setStandalone(isStandalone())
    setIos(isIos())

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setJustInstalled(true)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (standalone || justInstalled) return null
  if (!deferredPrompt && !ios) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 24, padding: '14px 16px', borderRadius: 16,
        background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: theme.accent, flexShrink: 0 }}>
          install_mobile
        </span>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>Pasang sebagai Aplikasi</p>
      </div>

      {deferredPrompt ? (
        <>
          <p style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
            Install AMK Admin Portal ke home screen untuk akses lebih cepat, seperti aplikasi biasa.
          </p>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              color: '#fff', border: 'none', cursor: installing ? 'not-allowed' : 'pointer',
              background: installing ? 'rgba(7,82,183,0.5)' : theme.accent,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            {installing ? 'Memasang...' : 'Install Aplikasi'}
          </button>
        </>
      ) : (
        <p style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 6, lineHeight: 1.6 }}>
          Di Safari, ketuk ikon <strong>Share</strong>{' '}
          <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle', color: theme.textSecondary }}>ios_share</span>{' '}
          lalu pilih <strong>&quot;Add to Home Screen&quot;</strong> untuk memasang sebagai aplikasi.
        </p>
      )}
    </div>
  )
}
