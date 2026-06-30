import type { Metadata } from 'next'
import Link from 'next/link'
import RevealProvider from '@/components/RevealProvider'

export const metadata: Metadata = {
  title: 'Tentang AMK | Visi, Misi & Unit Bisnis',
  description:
    'Pelajari visi, misi, dan unit bisnis PT. Adikara Mandala Kreasi (AMK) yang menggabungkan video production, branding, digital marketing, audio, dan solusi kreatif AI.',
  openGraph: {
    title: 'Tentang AMK | Visi, Misi & Unit Bisnis',
    description:
      'Pelajari visi, misi, dan unit bisnis PT. Adikara Mandala Kreasi (AMK).',
    images: ['/images/company.png'],
  },
}

const missions = [
  'Kami fokus memproduksi karya visual premium, seperti foto, film, video dan musik dengan standar estetika tinggi yang diperkuat oleh kekuatan storytelling yang mendalam.',
  'Secara konsisten mengimplementasikan teknologi mutakhir seperti AI dan Data-Driven Marketing ke dalam setiap strategi kampanye untuk memastikan hasil yang inovatif dan terukur bagi klien.',
  'Membangun ekosistem bisnis yang sehat dan berkelanjutan bagi para Key Partners serta talenta kreatif melalui sistem manajemen yang transparan dan profesional.',
  'Memberikan dampak nyata dengan menyediakan platform distribusi serta eksibisi yang inklusif bagi karya-karya lokal agar dapat bersaing di kancah yang lebih luas.',
]

const businessUnits = [
  { code: '59122', title: 'Production House & Digital Content', desc: 'Fokus pada produksi film, iklan, dan konten digital berkualitas tinggi.' },
  { code: '73100', title: 'Integrated Advertising Planning', desc: 'Perencanaan iklan terpadu secara online maupun offline.' },
  { code: '59201', title: 'Audio Production & Podcasting', desc: 'Layanan audio profesional, podcast, hingga dubbing.' },
  { code: '60202', title: 'TV Program Provision', desc: 'Penyediaan konten kreatif untuk program televisi.' },
  { code: '59132', title: 'Broadcasting Rights & Licensing', desc: 'Lisensi hak tayang untuk platform OTT dan Bioskop.' },
  { code: '59202', title: 'Copyright Management', desc: 'Pengelolaan hak cipta dan publishing.' },
  { code: '59140', title: 'Modern Mobile Cinema', desc: 'Eksibisi film dan non-bioskop atau layar tancap modern.' },
  { code: '46412', title: 'Merchandise & Uniform', desc: 'Produksi serta distribusi merchandise dan uniform / seragam korporat.' },
  { code: '63111', title: 'AI & Data for Creative Strategy', desc: 'Pemanfaatan teknologi AI dan analisis data untuk strategi kreatif yang terukur.' },
]

export default function AboutPage() {
  return (
    <>
      <RevealProvider />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-surface">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.08),transparent_50%)]" />
          <div className="max-w-6xl mx-auto px-8 text-center relative z-10">
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em] font-bold mb-6">
              Tentang AMK
            </span>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-primary leading-tight">
              Visi, Misi, dan Unit Bisnis PT. Adikara Mandala Kreasi
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-on-surface-variant leading-relaxed">
              Kami hadir sebagai mitra kreatif yang membangun pengalaman brand menyeluruh melalui produksi video,
              pemasaran digital, branding, audio, dan solusi AI yang menciptakan dampak nyata.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-8 py-20 space-y-16">
          {/* Visi */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-headline font-bold text-primary">Visi Kami</h2>
              <p className="text-lg text-on-surface-variant leading-relaxed">
                Menjadi ekosistem kreatif digital terintegrasi terdepan di Indonesia yang secara harmonis menyatukan
                seni visual, teknologi data, dan strategi komunikasi tingkat tinggi untuk memberdayakan brand serta
                para kreator di skala global.
              </p>
            </div>
          </div>

          {/* Misi */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-headline font-bold text-primary">Misi Kami</h2>
              <p className="text-lg text-on-surface-variant leading-relaxed">
                Kami berfokus pada eksekusi kreatif yang terukur, kolaborasi yang personal, dan solusi end-to-end
                untuk membantu setiap brand mencapai tujuan bisnisnya.
              </p>
            </div>
            <div className="grid gap-6">
              {missions.map((mission, i) => (
                <div key={i} className="p-8 bg-surface rounded-[2rem] border border-outline-variant/10 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.25em] font-bold text-on-surface-variant">
                    Misi {i + 1}
                  </p>
                  <p className="mt-4 text-on-surface-variant leading-relaxed">{mission}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Bisnis */}
          <section className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-4xl font-headline font-bold text-primary">Unit Bisnis Kami</h2>
              <p className="text-lg text-on-surface-variant leading-relaxed">
                PT. Adikara Mandala Kreasi (AMK) didukung oleh legalitas hukum yang kuat di berbagai sektor strategis
                industri kreatif. Kami mengintegrasikan kreatifitas tradisional dengan teknologi masa depan melalui
                klasifikasi usaha dengan KLBI berikut:
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {businessUnits.map((unit) => (
                <article
                  key={unit.code}
                  className="p-8 bg-surface rounded-[2rem] border border-outline-variant/10 shadow-sm"
                >
                  <p className="text-2xl text-primary">{unit.code}</p>
                  <h3 className="mt-4 text-xl font-bold text-on-surface">{unit.title}</h3>
                  <p className="mt-3 text-on-surface-variant leading-relaxed">{unit.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 rounded-[2rem] border border-outline-variant/10 bg-primary-container/10 p-10 text-center">
            <h2 className="text-3xl font-headline font-bold text-primary">Siap kenali AMK lebih jauh?</h2>
            <p className="mt-4 text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Kembali ke halaman utama atau langsung jelajahi layanan kami untuk melihat bagaimana AMK dapat membantu
              brand Anda tumbuh.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/#home"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="/services/marketing"
                className="inline-flex items-center justify-center rounded-full border border-primary text-primary bg-surface px-8 py-4 text-sm font-bold hover:bg-primary/5 transition-all"
              >
                Jelajahi Layanan Kami
              </Link>
              <a
                href="/compro-amk-2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-8 py-4 text-sm font-bold shadow-lg shadow-slate-800 hover:bg-slate-800 transition-all"
              >
                Download Company Profile PDF
              </a>
            </div>
          </section>
        </section>
      </main>
    </>
  )
}
