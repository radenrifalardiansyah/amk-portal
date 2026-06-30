import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'

export const metadata: Metadata = {
  title: 'AMK Creative Agency Bogor | Video Production, Digital Marketing, Branding',
  description:
    'PT. Adikara Mandala Kreasi (AMK) adalah creative agency di Bogor yang menyediakan produksi video, desain brand, pemasaran digital, dan solusi konten untuk bisnis modern.',
  keywords:
    'Creative Agency Bogor, Video Production Bogor, Digital Marketing Bogor, Branding Agency, Konten Kreatif',
  openGraph: {
    title: 'AMK Creative Agency Bogor | Video Production, Digital Marketing, Branding',
    description:
      'PT. Adikara Mandala Kreasi (AMK) adalah creative agency di Bogor yang menyediakan produksi video, desain brand, pemasaran digital, dan solusi konten untuk bisnis modern.',
    images: ['/images/company.png'],
    type: 'website',
  },
  icons: { icon: '/images/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      </head>
      <body className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
        <Navbar />
        <div className="page-enter">{children}</div>
        <Footer />
        <BackToTop />
      </body>
    </html>
  )
}
