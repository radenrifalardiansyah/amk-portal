import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { servicesService } from '@/lib/services'

export const revalidate = 0

export async function generateStaticParams() {
  const slugs = await servicesService.getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = await servicesService.getBySlug(slug)
  if (!service) return {}
  return {
    title: `${service.title} | AMK Creative Agency`,
    description: service.subtitle,
    openGraph: { images: [service.image] },
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await servicesService.getBySlug(slug)
  if (!service) notFound()

  return (
    <>
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] animate-fluid" />
          </div>
          <div className="max-w-7xl mx-auto px-8 relative z-10 text-center reveal-scale active">
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              {service.badge}
            </span>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary mb-6">{service.title}</h1>
            <p className="text-xl text-on-surface-variant max-w-3xl mx-auto">{service.subtitle}</p>
          </div>
        </section>

        <section className="py-20 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20">
                <Image src={service.image} alt={service.imageAlt} fill className="object-cover" />
              </div>
            </div>
            <div className="space-y-8 reveal-right">
              <div>
                <h3 className="text-3xl font-headline font-bold text-primary mb-4">{service.heading}</h3>
                <p className="text-on-surface-variant leading-relaxed">{service.body}</p>
              </div>
              <div className="grid gap-6">
                {service.features.map((feature) => (
                  <div key={feature.title} className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="material-symbols-outlined text-primary">{feature.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-on-surface">{feature.title}</h4>
                      <p className="text-on-surface-variant text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary/5 text-center">
          <h2 className="text-3xl font-headline font-bold text-primary mb-6">{service.ctaTitle}</h2>
          <Link
            href="/#contact"
            className="inline-flex px-8 py-4 hero-gradient text-on-primary font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
          >
            {service.ctaLabel}
          </Link>
        </section>
      </main>
    </>
  )
}
