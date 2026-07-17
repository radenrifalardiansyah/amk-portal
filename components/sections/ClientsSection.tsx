'use client'

import Link from 'next/link'
import ClientLogo from '@/components/ClientLogo'
import type { Client, ClientsSectionContent } from '@/lib/services'

export default function ClientsSection({ clients, content }: { clients: Client[]; content: ClientsSectionContent }) {
  const half = Math.ceil(clients.length / 2)
  const row1 = clients.slice(0, half)
  const row2 = clients.slice(half)

  return (
    <section className="py-12 bg-surface-container-lowest reveal scroll-mt-24" id="clients">
      <div className="max-w-7xl mx-auto px-8 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">{content.heading}</h2>
            <p className="text-on-surface-variant max-w-xl">
              {content.description}
            </p>
          </div>
          <Link
            href="/clients"
            className="px-8 py-3 border border-primary/30 text-primary font-headline font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center space-x-2 shrink-0"
          >
            <span>Lihat Semua Client</span>
            <span className="material-symbols-outlined">handshake</span>
          </Link>
        </div>
        <div className="marquee py-6">
          <div className="marquee-content flex items-center">
            {row1.map((c) => (
              <ClientLogo
                key={c.id}
                src={c.src}
                name={c.name}
                className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            ))}
          </div>
          <div aria-hidden="true" className="marquee-content flex items-center">
            {row2.map((c) => (
              <ClientLogo
                key={c.id}
                src={c.src}
                name={c.name}
                className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
