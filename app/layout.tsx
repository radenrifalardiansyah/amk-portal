import type { Metadata } from 'next'
import './globals.css'
import { siteContentService } from '@/lib/services'
import { SITE_URL } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const company = await siteContentService.getCompany()
  const title = `${company.shortName} Creative Agency Bogor | Video Production, Digital Marketing, Branding`
  const description =
    `${company.legalName} (${company.shortName}) adalah creative agency di Bogor yang menyediakan produksi video, desain brand, pemasaran digital, dan solusi konten untuk bisnis modern.`

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${company.shortName || 'AMK'}`,
    },
    description,
    keywords:
      'Creative Agency Bogor, Video Production Bogor, Digital Marketing Bogor, Branding Agency, Konten Kreatif',
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: '/',
      siteName: company.shortName || 'AMK',
      images: ['/images/company.png'],
      type: 'website',
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/company.png'],
    },
    icons: { icon: company.logoUrl || '/images/logo.png' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const company = await siteContentService.getCompany()

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.legalName || 'PT. Adikara Mandala Kreasi',
    alternateName: company.shortName || 'AMK',
    url: SITE_URL,
    logo: company.logoUrl ? absoluteAsset(company.logoUrl) : `${SITE_URL}/images/logo.png`,
    description: company.tagline,
    address: company.address ? {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressCountry: 'ID',
    } : undefined,
    email: company.email || undefined,
    telephone: company.phone ? `+${company.phone}` : undefined,
    sameAs: [company.instagramUrl, company.linkedinUrl].filter(Boolean),
  }

  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}

function absoluteAsset(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}
