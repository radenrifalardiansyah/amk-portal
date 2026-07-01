import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/lib/services'

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewsSection({ previews }: { previews: NewsArticle[] }) {
  if (previews.length === 0) return null

  return (
    <section className="py-24 bg-surface reveal" id="news">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 reveal">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">Berita</h2>
            <p className="text-on-surface-variant max-w-xl">
              Kabar terbaru, pencapaian, dan wawasan industri kreatif dari tim AMK.
            </p>
          </div>
          <Link
            href="/news"
            className="px-8 py-3 border border-primary/30 text-primary font-headline font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center space-x-2"
          >
            <span>Lihat Semua Berita</span>
            <span className="material-symbols-outlined">newspaper</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {previews.map((item, i) => (
            <Link
              key={item.slug}
              href={`/news/${item.slug}`}
              className="reveal-scale group block rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 hover-lift"
              style={i > 0 ? { transitionDelay: `${i * 0.15}s` } : {}}
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-on-surface-variant mb-2">{formatDate(item.publishedAt)}</p>
                <h4 className="text-lg font-headline font-bold text-primary mb-2 leading-snug line-clamp-2">{item.title}</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{item.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
