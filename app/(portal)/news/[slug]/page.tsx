import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { newsService, siteContentService } from '@/lib/services'
import { SITE_URL, absoluteUrl } from '@/lib/seo'

export const revalidate = 0

export async function generateStaticParams() {
  const slugs = await newsService.getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await newsService.getBySlug(slug)
  if (!article || article.status !== 'published') return {}
  return {
    title: `${article.title} | AMK News`,
    description: article.excerpt,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `/news/${slug}`,
      images: [article.coverImage],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags.split(',').map((t) => t.trim()).filter(Boolean),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage],
    },
  }
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await newsService.getBySlug(slug)
  if (!article || article.status !== 'published') notFound()

  const [all, company] = await Promise.all([
    newsService.getAllPublished(),
    siteContentService.getCompany(),
  ])
  const others = all.filter((a) => a.slug !== article.slug).slice(0, 3)
  const tags = article.tags.split(',').map((t) => t.trim()).filter(Boolean)
  const paragraphs = article.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: [absoluteUrl(article.coverImage)],
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    articleSection: article.category,
    keywords: tags.join(', '),
    author: { '@type': 'Person', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: company.shortName || 'AMK',
      logo: { '@type': 'ImageObject', url: absoluteUrl(company.logoUrl || '/images/logo.png') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/news/${slug}`) },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Berita', item: `${SITE_URL}/news` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/news/${slug}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    <main>
      <section className="relative pt-32 pb-16 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] animate-fluid" />
        <div className="max-w-4xl mx-auto px-8 relative z-10 text-center reveal-scale active">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            {article.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6 leading-tight">{article.title}</h1>
          <div className="flex items-center justify-center gap-2 text-on-surface-variant text-sm">
            <span className="font-semibold">{article.author}</span>
            <span>&middot;</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-20">
        <div className="relative w-full h-[40vh] md:h-[55vh] rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/20 mb-14">
          <Image src={article.coverImage} alt={article.title} fill className="object-cover" priority unoptimized />
        </div>

        <article className="prose-none space-y-6 max-w-3xl mx-auto">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-lg text-on-surface-variant leading-relaxed">{p}</p>
          ))}
        </article>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 max-w-3xl mx-auto">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-16 pt-10 border-t border-outline-variant/20 max-w-3xl mx-auto">
          <Link href="/news" className="text-primary font-bold hover:underline inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Berita
          </Link>
        </div>
      </section>

      {others.length > 0 && (
        <section className="bg-surface-container-low py-20">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="text-2xl font-headline font-bold text-primary mb-8">Artikel Lainnya</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="group block rounded-3xl overflow-hidden bg-surface border border-outline-variant/10 hover-lift"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-on-surface-variant mb-2">{formatDate(item.publishedAt)}</p>
                    <h3 className="text-base font-headline font-bold text-primary leading-snug line-clamp-2">{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
    </>
  )
}
