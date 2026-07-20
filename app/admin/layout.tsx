import type { Metadata, Viewport } from 'next'
import AdminPwaSetup from '@/components/admin/AdminPwaSetup'
import { siteContentService } from '@/lib/services'
import { faviconUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const company = await siteContentService.getCompany()

  return {
    title: { absolute: `${company.shortName || 'AMK'} Admin` },
    robots: { index: false, follow: false },
    manifest: '/admin/manifest.webmanifest',
    icons: {
      // Root layout's `icons.icon` doesn't carry over here since this segment
      // defines its own `icons`, so the browser-tab favicon must be repeated.
      icon: faviconUrl(company),
      // iOS is unreliable with data: URI apple-touch-icon tags, so always use the bundled PNG.
      apple: '/icons/apple-touch-icon.png',
    },
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
