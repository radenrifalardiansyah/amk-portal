import Image from 'next/image'

const leaders = [
  { name: 'Rizqi Maulana', role: 'Leading Director', image: '/images/risqi.jpeg' },
  { name: 'Meida Pitaloka', role: 'Commissioner', image: '/images/meida.jpeg', delay: '0.2s' },
  { name: 'Luthfi Hafiz', role: 'Head of Operations', image: '/images/luthfi.jpeg', delay: '0.4s' },
]

export default function LeadershipSection() {
  return (
    <section className="py-24" id="leadership">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 reveal">
          <h2 className="text-5xl font-headline font-bold text-primary mb-4">Visionary Minds</h2>
          <p className="text-on-surface-variant">Pemimpin di balik inovasi PT. Adikara Mandala Kreasi.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="reveal-scale group relative overflow-hidden rounded-3xl bg-surface-container text-center pb-8 border border-outline-variant/10 hover-lift"
              style={leader.delay ? { transitionDelay: leader.delay } : {}}
            >
              <div className="aspect-[3/4] overflow-hidden mb-6 relative">
                <Image
                  src={leader.image}
                  alt={leader.name}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                />
              </div>
              <h3 className="text-2xl font-headline font-bold text-primary">{leader.name}</h3>
              <p className="text-on-surface-variant font-medium">{leader.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
