import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { portfolioService } from '@/lib/services'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Portfolio | AMK Creative Agency',
  description: 'Jelajahi karya-karya terpilih PT. Adikara Mandala Kreasi — dari produksi video sinematik, hybrid event, hingga strategi digital.',
  alternates: { canonical: '/portfolio' },
  openGraph: {
    title: 'Portfolio | AMK Creative Agency',
    description: 'Jelajahi karya-karya terpilih PT. Adikara Mandala Kreasi — dari produksi video sinematik, hybrid event, hingga strategi digital.',
    url: '/portfolio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio | AMK Creative Agency',
    description: 'Jelajahi karya-karya terpilih PT. Adikara Mandala Kreasi.',
  },
}

export default async function PortfolioPage() {
  const projects = await portfolioService.getAll()

  return (
    <>
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.08),transparent_50%)]" />
          <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
              Portfolio
            </span>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
              Recent Manifestations
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
              Setiap proyek adalah bukti nyata dari dedikasi kami terhadap kualitas dan inovasi.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-8 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="reveal-scale group block rounded-3xl overflow-hidden bg-surface-container-low border border-outline-variant/10 hover-lift"
                style={i > 0 ? { transitionDelay: `${i * 0.15}s` } : {}}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-widest">
                      {project.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-headline font-bold text-primary mb-2">{project.title}</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{project.description}</p>
                  <div className="mt-4 flex items-center space-x-2 text-primary font-bold text-sm">
                    <span>View Case Study</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
