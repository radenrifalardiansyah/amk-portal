import Image from 'next/image'

const advantages = [
  {
    icon: 'target',
    title: 'Precision Execution',
    body: 'Kami menjamin proyek ditangani langsung oleh praktisi industri profesional--mulai dari sutradara, fotografer hingga pilot drone berlisensi, untuk memastikan hasil yang presisi dan berkualitas tinggi.',
  },
  {
    icon: 'auto_awesome',
    title: 'Predictive Creativity',
    body: 'Kami tidak hanya mengandalkan intuisi. Setiap proses kreatif didukung oleh analisis tren berbasi AI guna menghasilkan konten yang tidak hanya estetik, tetapi juga akurat menembus algoritma pasar saat ini.',
  },
  {
    icon: 'hub',
    title: 'Seamless Ecosystem',
    body: 'Sebagai agensi one-stop solution, kami menangani seluruh alur kerja mulai dari konsep, produksi audio-visual hingga manajemen iklan dalam satu ekosistem yang efesien dam terintegrasi.',
  },
  {
    icon: 'trending_up',
    title: 'Optimized Investment',
    body: 'Kami berkomitmen memberikan hasil kelas atas dengan skema harga yang tetap masuk akal. Efisiensi biaya terjadi karena seluruh aset produksi adalah milik sendiri (in-house), memastikan investasi Anda memberika dampak maksimal.',
  },
]

export default function AdvantageSection() {
  return (
    <section className="py-32 bg-surface overflow-hidden relative" id="advantage">
      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 items-center">
        <div className="relative reveal-left">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-20 animate-pulse" />
          <div className="relative z-10 rounded-3xl overflow-hidden rotate-1 hover:rotate-0 transition-all duration-700 shadow-[0_0_50px_rgba(37,99,235,0.15)] border border-primary/20">
            <Image
              src="/images/tech.png"
              alt="Tech Visual"
              width={600}
              height={450}
              className="w-full scale-105 object-cover"
            />
          </div>
          <div className="absolute -bottom-10 -right-10 bg-surface-container-highest p-8 rounded-2xl border border-primary/30 shadow-2xl z-20 reveal-scale">
            <span className="text-primary font-headline font-bold text-2xl">Innovation First</span>
          </div>
        </div>

        <div className="space-y-12 reveal-right">
          <div className="space-y-4">
            <h2 className="text-5xl font-headline font-bold text-primary">The AMK Advantage</h2>
            <p className="text-on-surface-variant text-lg">
              Keunggulan kompetitif yang mendefinisikan setiap langkah strategis kami.
            </p>
          </div>

          <div className="grid gap-8 reveal">
            {advantages.map((adv) => (
              <div
                key={adv.title}
                className="stagger-item flex items-start space-x-6 p-6 rounded-2xl bg-surface-container-low/50 border border-outline-variant/10 hover:border-primary/30 transition-all"
              >
                <div className="mt-1 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl">{adv.icon}</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-xl text-primary mb-2">{adv.title}</h4>
                  <p className="text-on-surface-variant">{adv.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
