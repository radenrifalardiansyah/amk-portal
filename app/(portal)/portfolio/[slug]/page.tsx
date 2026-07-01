import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { portfolioService } from '@/lib/services'

export const revalidate = 0

export async function generateStaticParams() {
  const slugs = await portfolioService.getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = await portfolioService.getBySlug(slug)
  if (!project) return {}
  return {
    title: `${project.title} | AMK Portfolio`,
    description: project.description,
    openGraph: { images: [project.image] },
  }
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await portfolioService.getBySlug(slug)
  if (!project) notFound()

  return (
    <>
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] animate-fluid" />
          <div className="max-w-7xl mx-auto px-8 relative z-10 text-center reveal-scale active">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              {project.category}
            </span>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary mb-6">{project.title}</h1>
            <p className="text-xl text-on-surface-variant max-w-3xl mx-auto mb-10">{project.description}</p>

            <div className="relative w-full h-[60vh] rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/20 mb-16">
              <Image src={project.image} alt={project.title} fill className="object-cover" priority />
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left border-t border-b border-outline-variant/20 py-12 mb-16">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Client</h4>
                <p className="text-xl text-on-surface font-headline font-medium">{project.client}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Services Delivered</h4>
                <p className="text-xl text-on-surface font-headline font-medium">{project.services}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Year</h4>
                <p className="text-xl text-on-surface font-headline font-medium">{project.year}</p>
              </div>
            </div>

            <div className="text-left space-y-12 max-w-4xl mx-auto">
              <div>
                <h3 className="text-3xl font-headline font-bold text-primary mb-4">Tantangan</h3>
                <p className="text-lg text-on-surface-variant leading-relaxed">{project.challenge}</p>
              </div>
              <div>
                <h3 className="text-3xl font-headline font-bold text-primary mb-4">Solusi AMK</h3>
                <p className="text-lg text-on-surface-variant leading-relaxed">{project.solution}</p>
              </div>
              <div>
                <h3 className="text-3xl font-headline font-bold text-primary mb-4">Hasil</h3>
                <p className="text-lg text-on-surface-variant leading-relaxed">{project.result}</p>
              </div>
            </div>

            <div className="mt-20 flex justify-between items-center border-t border-outline-variant/20 pt-10">
              <Link href="/portfolio" className="text-primary font-bold hover:underline">
                &larr; Back to Portfolio
              </Link>
              {project.nextSlug && (
                <Link href={`/portfolio/${project.nextSlug}`} className="text-primary font-bold hover:underline">
                  Next Project: {project.nextLabel} &rarr;
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
