import Link from 'next/link'
import MediaCoverThumb from '@/components/MediaCoverThumb'
import TiltCard from '@/components/TiltCard'
import ClientLogo from '@/components/ClientLogo'
import type { PortfolioProject } from '@/data/portfolio'
import type { PortfolioSectionContent } from '@/lib/services'
import type { Client } from '@/lib/services/clientsService'

export default function PortfolioSection({ previews, content, clients }: { previews: PortfolioProject[]; content: PortfolioSectionContent; clients: Client[] }) {
  const clientMap = new Map(clients.map((c) => [c.id, c]))

  return (
    <section className="py-24 bg-surface-container-low reveal scroll-mt-8" id="portfolio">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 reveal">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">{content.heading}</h2>
            <p className="text-on-surface-variant max-w-xl">
              {content.description}
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
          {previews.map((item, i) => (
            <TiltCard
              key={item.slug}
              className="reveal-scale"
              style={i > 0 ? { transitionDelay: `${i * 0.2}s` } : {}}
            >
              <Link
                href={`/portfolio/${item.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-video bg-surface-bright shadow-lg block h-full"
              >
                <MediaCoverThumb
                  image={item.image}
                  imageType={item.imageType}
                  alt={item.title}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="flex items-center gap-3">
                    {item.clientId && clientMap.get(item.clientId)?.src && (
                      <ClientLogo
                        src={clientMap.get(item.clientId)!.src}
                        name={clientMap.get(item.clientId)!.name}
                        className="h-8 w-8 rounded-full object-contain bg-white/90 p-1 shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.category}</p>
                      <h4 className="text-lg font-headline font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-white/70 mt-1">{item.client}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}
