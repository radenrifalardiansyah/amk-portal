import type { KeyPartner } from '@/lib/services'

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

export default function KeyPartnersSection({ partners }: { partners: KeyPartner[] }) {
  if (!partners.length) return null

  return (
    <section className="py-24" id="key-partners">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 reveal">
          <h2 className="text-5xl font-headline font-bold text-primary mb-4">Key Partners</h2>
          <p className="text-on-surface-variant">Kolaborasi dengan talenta dan mitra terbaik di setiap lini produksi.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {partners.map((p, i) => (
            <div
              key={p.id}
              className="reveal-scale p-8 bg-surface-container rounded-3xl border border-outline-variant/10 hover-lift"
              style={i > 0 ? { transitionDelay: `${i * 0.1}s` } : {}}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">{p.icon}</span>
                </div>
                <h3 className="text-lg font-headline font-bold text-primary">{p.category}</h3>
              </div>
              <ul className="flex flex-wrap gap-2">
                {p.members.map((m, j) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/10"
                  >
                    <div>
                      <span className="block text-sm font-semibold text-on-surface">{m.name}</span>
                      {m.role && (
                        <span className="block text-xs text-on-surface-variant">{m.role}</span>
                      )}
                    </div>
                    {m.instagram && (
                      <a
                        href={instagramUrl(m.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Instagram ${m.name}`}
                        className="flex-shrink-0 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <InstagramIcon />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
