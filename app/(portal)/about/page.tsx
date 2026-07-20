import type { Metadata } from 'next'
import Link from 'next/link'
import { siteContentService } from '@/lib/services'
import AboutSection from '@/components/sections/AboutSection'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Tentang AMK',
  description:
    'Kenali lebih jauh PT. Adikara Mandala Kreasi (AMK), agensi kreatif digital yang menggabungkan video production, branding, digital marketing, audio, dan solusi kreatif AI.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Tentang AMK',
    description:
      'Kenali lebih jauh PT. Adikara Mandala Kreasi (AMK).',
    url: '/about',
    images: ['/images/company.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tentang AMK',
    description:
      'Kenali lebih jauh PT. Adikara Mandala Kreasi (AMK).',
    images: ['/images/company.png'],
  },
}

export default async function AboutPage() {
  const [content, aboutHome] = await Promise.all([
    siteContentService.getAboutPage(),
    siteContentService.getAboutHome(),
  ])

  return (
    <>
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(7,82,183,0.08),transparent_50%)]" />
          <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
              {content.badge}
            </span>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
              {content.heroTitle}
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
              {content.heroDescription}
            </p>
          </div>
        </section>

        <AboutSection content={aboutHome} />

        <section className="max-w-6xl mx-auto px-8 py-20">
          {/* CTA */}
          <section className="rounded-[2rem] border border-outline-variant/10 bg-primary-container/10 p-10 text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">Siap kenali AMK lebih jauh?</h2>
            <p className="mt-4 text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Kembali ke halaman utama atau langsung jelajahi layanan kami untuk melihat bagaimana AMK dapat membantu
              brand Anda tumbuh.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/#home"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="/services/marketing"
                className="inline-flex items-center justify-center rounded-full border border-primary text-primary bg-surface px-8 py-4 text-sm font-bold hover:bg-primary/5 transition-all"
              >
                Jelajahi Layanan Kami
              </Link>
              <a
                href="/compro-amk-2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-8 py-4 text-sm font-bold shadow-lg shadow-slate-800 hover:bg-slate-800 transition-all"
              >
                Download Company Profile PDF
              </a>
            </div>
          </section>
        </section>
      </main>
    </>
  )
}
