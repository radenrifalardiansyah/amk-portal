import Link from 'next/link'
import type { Service } from '@/data/services'

export default function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section className="py-24" id="services">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 space-y-4 reveal">
          <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">Core Pillars</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Kami menyediakan ekosistem terpadu untuk segala kebutuhan transformasi digital Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.slug}
              className="reveal stagger-item group p-8 bg-surface-container-low rounded-3xl hover:bg-surface-container-highest transition-all duration-300 border border-outline-variant/5 hover-lift flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-5xl mb-6 block group-hover:scale-110 transition-transform">
                  {service.navIcon}
                </span>
                <h3 className="text-2xl font-headline font-bold text-primary mb-4">{service.navTitle}</h3>
                <p className="text-on-surface-variant leading-relaxed mb-6">{service.navDescription}</p>
              </div>
              <Link
                href={`/services/${service.slug}`}
                className="text-primary font-headline font-bold flex items-center space-x-2 group-hover:text-primary-container transition-colors"
              >
                <span>View Details</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
