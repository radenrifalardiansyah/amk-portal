'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/lib/services'

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NewsExplorer({ articles }: { articles: NewsArticle[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(articles.map((a) => a.category)))],
    [articles],
  )

  const [featured, ...rest] = articles

  const filtered = useMemo(() => rest.filter((a) => {
    if (category !== 'Semua' && a.category !== category) return false
    if (!search) return true
    const q = search.toLowerCase()
    return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
  }), [rest, category, search])

  return (
    <section className="max-w-6xl mx-auto px-8 py-20">
      {featured && (
        <Link
          href={`/news/${featured.slug}`}
          className="reveal-scale group grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/10 hover-lift mb-16"
        >
          <div className="relative aspect-video md:aspect-auto md:h-full overflow-hidden">
            <Image
              src={featured.coverImage}
              alt={featured.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized
            />
            <div className="absolute top-5 left-5">
              <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-widest">
                Terbaru
              </span>
            </div>
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{featured.category}</span>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-4 leading-tight">{featured.title}</h2>
            <p className="text-on-surface-variant leading-relaxed mb-6">{featured.excerpt}</p>
            <div className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>{featured.author} &middot; {formatDate(featured.publishedAt)}</span>
              <span className="inline-flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                Baca Selengkapnya <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                category === c
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            type="text"
            placeholder="Cari berita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-outline mb-4 block">newspaper</span>
          <p className="text-on-surface-variant">Tidak ada berita yang ditemukan.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((article, i) => (
            <Link
              key={article.slug}
              href={`/news/${article.slug}`}
              className="reveal-scale group block rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/10 hover-lift"
              style={i > 0 ? { transitionDelay: `${Math.min(i, 6) * 0.1}s` } : {}}
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-widest">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-on-surface-variant mb-2">{formatDate(article.publishedAt)}</p>
                <h2 className="text-lg font-headline font-bold text-primary mb-2 leading-snug line-clamp-2">{article.title}</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
                <div className="mt-4 flex items-center space-x-2 text-primary font-bold text-sm">
                  <span>Baca Selengkapnya</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
