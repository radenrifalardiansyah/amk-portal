import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { clientsService } from '@/lib/services'
import { SITE_URL, ogImage } from '@/lib/seo'
import ClientLogo from '@/components/ClientLogo'

export const revalidate = false

export async function generateStaticParams() {
  const clients = await clientsService.getAll()
  return clients.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const client = await clientsService.getById(id)
  if (!client) return {}
  return {
    title: `${client.name} | Clients AMK Creative Agency`,
    description: client.description || `Profil client ${client.name}.`,
    alternates: { canonical: `/clients/${id}` },
    openGraph: {
      title: client.name,
      description: client.description || `Profil client ${client.name}.`,
      url: `/clients/${id}`,
      images: [ogImage(client.src)],
      type: 'website',
    },
  }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await clientsService.getById(id)
  if (!client) notFound()

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Clients', item: `${SITE_URL}/clients` },
      { '@type': 'ListItem', position: 3, name: client.name, item: `${SITE_URL}/clients/${id}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_70%)] animate-fluid" />
          <div className="max-w-4xl mx-auto px-8 relative z-10 text-center reveal-scale active">
            <div className="w-40 h-24 mx-auto mb-8 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-center p-4">
              <ClientLogo src={client.src} name={client.name} className="max-h-full max-w-full object-contain" />
            </div>
            {client.industry && (
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
                {client.industry}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-6 leading-tight">{client.name}</h1>
            {client.address && (
              <p className="text-on-surface-variant text-sm flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">location_on</span>
                {client.address}
              </p>
            )}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-8 pb-20">
          {client.description && (
            <p className="text-lg text-on-surface-variant leading-relaxed text-center">{client.description}</p>
          )}

          {client.website && (
            <div className="text-center mt-10">
              <a
                href={client.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 hero-gradient text-on-primary font-headline font-extrabold rounded-xl hover:scale-105 transition-all"
              >
                Kunjungi Website
                <span className="material-symbols-outlined">arrow_outward</span>
              </a>
            </div>
          )}

          <div className="mt-16 pt-10 border-t border-outline-variant/20 text-center">
            <Link href="/clients" className="text-primary font-bold hover:underline inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Kembali ke Clients
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
