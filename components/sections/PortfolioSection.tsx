import Link from 'next/link'
import Image from 'next/image'

const previews = [
  { slug: 'nippon', image: '/images/company.png', category: 'Cinematic Visuals', title: 'Nippon Express Global' },
  { slug: 'aston',  image: '/images/office.png',  category: 'Brand Experience',  title: 'Aston Bogor Hybrid Event', delay: '0.2s' },
  { slug: 'jica',   image: '/images/tech.png',    category: 'Digital Strategy',   title: 'JICA Innovation Hub', delay: '0.4s' },
]

export default function PortfolioSection() {
  return (
    <section className="py-24 bg-surface-container-low reveal" id="portfolio">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 reveal">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">Recent Manifestations</h2>
            <p className="text-on-surface-variant max-w-xl">
              Intip beberapa karya terpilih yang mendefinisikan standar keunggulan kami.
            </p>
          </div>
          <Link
            href="/portfolio"
            className="px-8 py-3 border border-primary/30 text-primary font-headline font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center space-x-2"
          >
            <span>View Full Portfolio</span>
            <span className="material-symbols-outlined">collections</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previews.map((item) => (
            <Link
              key={item.slug}
              href={`/portfolio/${item.slug}`}
              className="reveal-scale group relative overflow-hidden rounded-2xl aspect-video bg-surface-bright shadow-lg block"
              style={item.delay ? { transitionDelay: item.delay } : {}}
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.category}</p>
                  <h4 className="text-lg font-headline font-bold text-white">{item.title}</h4>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
