import Link from 'next/link'
import type { Service } from '@/data/services'
import type { ServicesSectionContent } from '@/lib/services'

export default function ServicesSection({ services, content }: { services: Service[]; content: ServicesSectionContent }) {
  return (
    <section className="py-24 scroll-mt-8" id="services">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 space-y-4 reveal">
          <h2 className="text-5xl font-headline font-bold text-primary tracking-tight">{content.heading}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="reveal stagger-item group p-8 bg-surface-container-low rounded-3xl hover:bg-surface-container-highest border border-outline-variant/5 hover-lift flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-5xl mb-6 block group-hover:scale-110 transition-transform duration-300">
                  {service.navIcon}
                </span>
                <h3 title={service.navTitle} className="text-2xl font-headline font-bold text-primary mb-2 line-clamp-2">{service.navTitle}</h3>
                {service.kbli && (
                  <p title={service.kbli} className="text-xs font-medium text-on-surface-variant/80 mb-3 line-clamp-2">
                    KBLI {service.kbli}
                  </p>
                )}
                <p className="text-on-surface-variant leading-relaxed mb-6 line-clamp-3">{service.navDescription}</p>
              </div>
              <span className="text-primary font-headline font-bold flex items-center space-x-2 group-hover:text-on-primary-container transition-colors duration-300">
                <span>View Details</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
