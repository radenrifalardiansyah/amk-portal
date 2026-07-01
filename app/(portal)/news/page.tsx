import type { Metadata } from 'next'
import { newsService } from '@/lib/services'
import NewsExplorer from './NewsExplorer'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Berita | AMK Creative Agency',
  description: 'Kabar terbaru, pencapaian, dan wawasan dari PT. Adikara Mandala Kreasi.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Berita | AMK Creative Agency',
    description: 'Kabar terbaru, pencapaian, dan wawasan dari PT. Adikara Mandala Kreasi.',
    url: '/news',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Berita | AMK Creative Agency',
    description: 'Kabar terbaru, pencapaian, dan wawasan dari PT. Adikara Mandala Kreasi.',
  },
}

export default async function NewsPage() {
  const articles = await newsService.getAllPublished()

  return (
    <main>
      <section className="relative pt-32 pb-16 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.08),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
          <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
            Berita
          </span>
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
            Kabar Terbaru AMK
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
            Ikuti pencapaian, kolaborasi, dan wawasan industri kreatif langsung dari tim kami.
          </p>
        </div>
      </section>

      {articles.length === 0 ? (
        <div className="max-w-6xl mx-auto px-8 py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-4 block">newspaper</span>
          <p className="text-on-surface-variant">Belum ada berita yang dipublikasikan.</p>
        </div>
      ) : (
        <NewsExplorer articles={articles} />
      )}
    </main>
  )
}
