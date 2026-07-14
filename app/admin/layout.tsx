import type { Metadata, Viewport } from 'next'
import AdminPwaSetup from '@/components/admin/AdminPwaSetup'
import { siteContentService } from '@/lib/services'

export async function generateMetadata(): Promise<Metadata> {
  const company = await siteContentService.getCompany()

  return {
    robots: { index: false, follow: false },
    manifest: '/admin/manifest.webmanifest',
    icons: { apple: company.logoUrl || '/icons/apple-touch-icon.png' },
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
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const company = await siteContentService.getCompany()

  return (
    <div className="admin-root">
      <AdminPwaSetup logoUrl={company.logoUrl} />
      {children}
    </div>
  )
}
