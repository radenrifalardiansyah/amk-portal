import type { Metadata } from 'next'
import Link from 'next/link'
import { clientsService, siteContentService } from '@/lib/services'
import ClientLogo from '@/components/ClientLogo'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Clients | AMK Creative Agency',
  description: 'Daftar klien yang telah mempercayakan proyeknya kepada PT. Adikara Mandala Kreasi.',
  alternates: { canonical: '/clients' },
  openGraph: {
    title: 'Clients | AMK Creative Agency',
    description: 'Daftar klien yang telah mempercayakan proyeknya kepada PT. Adikara Mandala Kreasi.',
    url: '/clients',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clients | AMK Creative Agency',
    description: 'Daftar klien yang telah mempercayakan proyeknya kepada PT. Adikara Mandala Kreasi.',
  },
}

export default async function ClientsPage() {
  const [clients, content] = await Promise.all([
    clientsService.getAll(),
    siteContentService.getClientsSection(),
  ])

  return (
    <main>
      <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(7,82,183,0.08),transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
          <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
            Clients
          </span>
          <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
            {content.heading || 'Our Clients'}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
            Kepercayaan dari berbagai institusi dan brand adalah bukti nyata dedikasi kami terhadap kualitas.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-20">
        {clients.length === 0 ? (
          <p className="text-center text-on-surface-variant">Belum ada data client.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="group reveal-scale flex flex-col items-center gap-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 p-6 text-center hover-lift"
              >
                <div className="h-16 w-full flex items-center justify-center">
                  <ClientLogo
                    src={c.src}
                    name={c.name}
                    className="h-14 w-auto max-w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-primary text-sm leading-snug">{c.name}</h3>
                  {c.industry && (
                    <p className="text-xs text-on-surface-variant mt-1">{c.industry}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
