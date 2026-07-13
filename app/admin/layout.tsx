import type { Metadata, Viewport } from 'next'
import AdminPwaSetup from '@/components/admin/AdminPwaSetup'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AMK Admin',
  },
  other: {
    // Legacy tag for iOS < 16.4 — `appleWebApp.capable` above only emits the modern
    // `mobile-web-app-capable` tag, which older iOS/Safari versions don't recognize.
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root">
      <AdminPwaSetup />
      {children}
    </div>
  )
}
