'use client'

import type { Client } from '@/lib/services'

export default function ClientsSection({ clients }: { clients: Client[] }) {
  const half = Math.ceil(clients.length / 2)
  const row1 = clients.slice(0, half)
  const row2 = clients.slice(half)

  return (
    <section className="py-24 bg-surface-container-lowest reveal" id="clients">
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <h2 className="text-center text-3xl font-headline font-bold text-primary opacity-60">Our Clients</h2>
        <div className="marquee py-12">
          <div className="marquee-content flex items-center">
            {row1.map((c) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={c.id}
                src={c.src}
                alt={c.name}
                className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                onError={(e) => {
                  const t = e.currentTarget
                  t.onerror = null
                  t.src = `https://placehold.co/200x80/f1f5f9/475569?text=${encodeURIComponent(c.name)}`
                }}
              />
            ))}
          </div>
          <div aria-hidden="true" className="marquee-content flex items-center">
            {row2.map((c) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={c.id}
                src={c.src}
                alt={c.name}
                className="h-16 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                onError={(e) => {
                  const t = e.currentTarget
                  t.onerror = null
                  t.src = `https://placehold.co/200x80/f1f5f9/475569?text=${encodeURIComponent(c.name)}`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
