'use client'

const clients = [
  { name: 'Nippon Express', src: '/images/clients/nippon.png' },
  { name: 'JICA', src: '/images/clients/jica.png' },
  { name: 'Kabupaten Bogor', src: '/images/clients/kabbogor.png' },
  { name: 'Balairung Hotel', src: '/images/clients/balairung.png' },
  { name: 'DPRD Kota Bogor', src: '/images/clients/dprdbogor.png' },
  { name: 'Walikota Bogor 2024', src: '/images/clients/walikota.png' },
  { name: 'PKS', src: '/images/clients/pks.png' },
  { name: 'J.E.E.F', src: '/images/clients/jeef.png' },
  { name: 'Bank Mandiri', src: '/images/clients/mandiri.png' },
  { name: 'Rizkia Tour & Travel', src: '/images/clients/rizkia.png' },
  { name: 'Desa Wisata Malasari', src: '/images/clients/malasari.png' },
  { name: 'Gerindra', src: '/images/clients/gerindra.png' },
  { name: 'Sekolah Alam Bogor', src: '/images/clients/salam.png' },
  { name: 'Universitas Pakuan Bogor', src: '/images/clients/pakuan.png' },
]

export default function ClientsSection() {
  return (
    <section className="py-24 bg-surface-container-lowest reveal" id="clients">
      <div className="max-w-7xl mx-auto px-8 mb-12">
        <h2 className="text-center text-3xl font-headline font-bold text-primary opacity-60">Our Clients</h2>
        <div className="marquee py-12">
          <div className="marquee-content flex items-center">
            {clients.slice(0, 7).map((c) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={c.name}
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
            {clients.slice(7).map((c) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={c.name}
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
