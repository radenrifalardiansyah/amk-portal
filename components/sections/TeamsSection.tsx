import SafeImage from '@/components/SafeImage'
import TiltCard from '@/components/TiltCard'
import type { Leader, KeyPartner, TeamsSectionContent } from '@/lib/services'

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
)

function instagramUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  const handle = value.replace(/^@/, '').trim()
  return `https://instagram.com/${handle}`
}

export default function TeamsSection({ leaders, partners, content }: { leaders: Leader[]; partners: KeyPartner[]; content: TeamsSectionContent }) {
  return (
    <section className="py-24 scroll-mt-8" id="teams">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 reveal">
          <h2 className="text-5xl font-headline font-bold text-primary mb-4">{content.heading}</h2>
          <p className="text-on-surface-variant">{content.description}</p>
        </div>

        {leaders.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {leaders.map((leader, i) => (
              <TiltCard
                key={leader.id}
                className="reveal-scale"
                style={i > 0 ? { transitionDelay: `${i * 0.2}s` } : {}}
              >
                <div className="group relative overflow-hidden rounded-3xl bg-surface-container text-center pb-8 border border-outline-variant/10 hover-lift h-full">
                  <div className="aspect-[3/4] overflow-hidden mb-6 relative">
                    <SafeImage
                      src={leader.image}
                      alt={leader.name}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-primary">{leader.name}</h3>
                  <p className="text-on-surface-variant font-medium">{leader.role}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        )}

        {partners.length > 0 && (
          <div className="pt-16 border-t border-outline-variant/10">
            <div className="text-center mb-12 reveal">
              <h3 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-3">{content.partnersHeading}</h3>
              <p className="text-on-surface-variant">{content.partnersDescription}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {partners.map((p, i) => (
                <div
                  key={p.id}
                  className="reveal-scale group relative overflow-hidden rounded-3xl bg-surface-container border border-outline-variant/10 hover-lift"
                  style={i > 0 ? { transitionDelay: `${i * 0.1}s` } : {}}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#5de1e6] to-primary opacity-70" />

                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
                        <span className="material-symbols-outlined text-primary text-2xl">{p.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-headline font-bold text-primary leading-snug">{p.category}</h4>
                        <p className="text-xs text-on-surface-variant font-medium">
                          {p.members.length} Anggota
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {p.members.map((m, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 transition-colors hover:border-primary/20"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#5de1e6] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold uppercase overflow-hidden">
                            {m.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              m.name.slice(0, 2)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-on-surface truncate">{m.name}</span>
                            {m.role && (
                              <span className="block text-xs text-on-surface-variant truncate">{m.role}</span>
                            )}
                          </div>
                          {m.instagram && (
                            <a
                              href={instagramUrl(m.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Instagram ${m.name}`}
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant bg-surface transition-all hover:text-white hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#bc1888]"
                            >
                              <InstagramIcon />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
