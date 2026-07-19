import type { Metadata } from 'next'
import { galleryService } from '@/lib/services'
import GalleryGrid from './GalleryGrid'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Gallery | AMK Creative Agency',
  description: 'Momen di balik layar dan hasil karya visual PT. Adikara Mandala Kreasi.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Gallery | AMK Creative Agency',
    description: 'Momen di balik layar dan hasil karya visual PT. Adikara Mandala Kreasi.',
    url: '/gallery',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gallery | AMK Creative Agency',
    description: 'Momen di balik layar dan hasil karya visual PT. Adikara Mandala Kreasi.',
  },
}

export default async function GalleryPage() {
  const items = await galleryService.getAll()

  return (
    <main>
      <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.08),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
          <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
            Gallery
          </span>
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
            Moments & Manifestations
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
            Kumpulan momen di balik layar dan hasil visual dari perjalanan kreatif kami.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-20">
        {items.length === 0 ? (
          <p className="text-center text-on-surface-variant">Belum ada foto di galeri.</p>
        ) : (
          <GalleryGrid items={items} />
        )}
      </section>
    </main>
  )
}
