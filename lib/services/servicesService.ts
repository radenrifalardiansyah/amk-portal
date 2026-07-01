import {
  collection, getDocs, getDoc, doc, setDoc, deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Service } from '@/data/services'

const COL = 'services'

const seedData: Service[] = [
  {
    slug: 'cinematic',
    badge: 'Core Pillar',
    title: 'Cinematic Visuals',
    subtitle:
      'Membawa narasi brand Anda ke tingkat selanjutnya melalui produksi video korporat, TVC, dan drone footage berkualitas sinema.',
    image: '/images/company.png',
    imageAlt: 'Cinematic Production',
    heading: 'Menceritakan Kisah Lewat Lensa',
    body: 'Di era digital yang penuh dengan distraksi, visual yang memukau adalah kunci untuk merebut perhatian audiens. Kami menggabungkan teknik sinematografi kelas atas dengan pemahaman mendalam tentang identitas brand Anda untuk menciptakan video yang tidak hanya indah, tetapi juga beresonansi dengan emosi target pasar Anda.',
    features: [
      {
        icon: 'movie_creation',
        title: 'TV Commercials (TVC)',
        description:
          'Produksi iklan televisi dan digital berstandar industri dengan storyboard yang matang dan eksekusi presisi.',
      },
      {
        icon: 'business',
        title: 'Corporate Video & Profil',
        description:
          'Tingkatkan kredibilitas dan kepercayaan mitra bisnis melalui video profil perusahaan yang elegan dan informatif.',
      },
      {
        icon: 'flight_takeoff',
        title: 'Aerial Drone Footage',
        description:
          'Sudut pandang yang luas dan memukau untuk dokumentasi proyek, lanskap, atau acara besar.',
      },
    ],
    ctaTitle: 'Siap Membuat Visual yang Memukau?',
    ctaLabel: 'Konsultasi Sekarang',
    navIcon: 'movie',
    navTitle: 'Cinematic Visuals',
    navDescription:
      'Video korporat, TVC, dan drone footage berkualitas sinema untuk narasi brand yang kuat.',
  },
  {
    slug: 'audio',
    badge: 'Core Pillar',
    title: 'Pro Audio',
    subtitle:
      'Bangun identitas suara yang kuat dengan produksi podcast, vodcast, dan sonic branding profesional.',
    image: '/images/office.png',
    imageAlt: 'Audio Production',
    heading: 'Identitas Melalui Suara',
    body: 'Audio lebih dari sekadar pelengkap visual; ia adalah elemen yang langsung menyentuh emosi. Kami merancang strategi audio komprehensif untuk memastikan brand Anda terdengar jelas di tengah kebisingan digital.',
    features: [
      {
        icon: 'podcasts',
        title: 'Podcast & Vodcast',
        description:
          'Fasilitas perekaman studio berstandar broadcast untuk menghasilkan konten perbincangan berkualitas tinggi.',
      },
      {
        icon: 'graphic_eq',
        title: 'Sonic Branding',
        description:
          'Menciptakan jingle, efek suara (SFX), dan identitas audio eksklusif yang membuat audiens langsung mengenali brand Anda.',
      },
    ],
    ctaTitle: 'Siap Untuk Terdengar Berbeda?',
    ctaLabel: 'Jadwalkan Sesi Studio',
    navIcon: 'mic_external_on',
    navTitle: 'Pro Audio',
    navDescription:
      'Produksi Podcast/Vodcast dan Sonic Branding untuk identitas suara yang tak terlupakan.',
  },
  {
    slug: 'marketing',
    badge: 'Core Pillar',
    title: 'Data-Driven Marketing',
    subtitle:
      'Maksimalkan ROI Anda dengan kampanye pemasaran digital yang dioptimalkan berdasarkan data dan algoritma terkini.',
    image: '/images/tech.png',
    imageAlt: 'Digital Marketing',
    heading: 'Keputusan Berbasis Data, Bukan Asumsi',
    body: 'Kreativitas tanpa distribusi yang tepat adalah sia-sia. Tim growth hacker kami menganalisis tren, melacak metrik, dan menyusun strategi presisi untuk menargetkan prospek yang paling berharga bagi bisnis Anda.',
    features: [
      {
        icon: 'ads_click',
        title: 'Digital Ads Strategy',
        description:
          'Manajemen kampanye Meta Ads, Google Ads, dan TikTok Ads dengan optimasi konversi (CRO) berkelanjutan.',
      },
      {
        icon: 'search_insights',
        title: 'SEO & Content Marketing',
        description:
          'Optimasi mesin pencari organik dan artikel blog berkualitas untuk membangun otoritas domain jangka panjang.',
      },
      {
        icon: 'campaign',
        title: 'Social Media Management',
        description:
          'Perencanaan kalender konten, desain feed, dan interaksi audiens untuk meningkatkan engagement rate.',
      },
    ],
    ctaTitle: 'Siap Mendominasi Pasar?',
    ctaLabel: 'Mulai Analisis Brand Anda',
    navIcon: 'query_stats',
    navTitle: 'Data-Driven Marketing',
    navDescription:
      'Strategi Ads, SEO, dan Social Media Management berbasis intelijen pasar yang akurat.',
  },
  {
    slug: 'aicreative',
    badge: 'AI Creative',
    title: 'AI Creative Assistant',
    subtitle:
      'Ubah ide menjadi konten kreatif berkualitas dengan akselerasi AI untuk visual, storytelling, dan pengalaman brand yang lebih tajam.',
    image: '/images/tech.png',
    imageAlt: 'AI Creative Assistant',
    heading: 'Kreativitas Dipadukan dengan Kecerdasan Buatan',
    body: 'Ide besar membutuhkan eksekusi cerdas. AMK menghadirkan AI Creative Assistant yang mendukung produksi konten visual, copywriting, dan iterasi kreatif agar cepat tampil relevan di setiap kanal.',
    features: [
      {
        icon: 'auto_graph',
        title: 'AI-Powered Creative Design',
        description:
          'Desain aset visual dan animasi yang diperkaya AI untuk menghadirkan identitas brand yang konsisten dan menarik.',
      },
      {
        icon: 'auto_mode',
        title: 'Smart Content & Copy',
        description:
          'Konten narasi, caption, dan copy persuasif yang dirancang AI agar relevan dengan audiens dan tujuan kampanye Anda.',
      },
      {
        icon: 'insights',
        title: 'Automated Creative Optimization',
        description:
          'Uji variasi kreatif secara otomatis untuk menemukan kombinasi yang paling efektif dalam meningkatkan engagement dan konversi.',
      },
    ],
    ctaTitle: 'Siap Bawa Kreativitas Anda ke Level Selanjutnya?',
    ctaLabel: 'Jelajahi Strategi AI Kreatif',
    navIcon: 'psychology',
    navTitle: 'AI Creative Assistant',
    navDescription:
      'Transformasi ide kreatif menjadi konten berdampak tinggi melalui optimasi AI.',
  },
  {
    slug: 'o2obrand',
    badge: 'O2O Brand',
    title: 'Strategi O2O Brand Activation',
    subtitle:
      'Bangun koneksi mulus antara pengalaman digital dan offline untuk meningkatkan awareness, kunjungan toko, dan transaksi nyata.',
    image: '/images/tech.png',
    imageAlt: 'O2O Brand Activation',
    heading: 'Menghubungkan Dunia Digital dan Offline',
    body: 'AMK menciptakan pengalaman O2O yang membuat brand Anda relevan di layar dan terasa langsung di lokasi. Mulai dari kampanye online hingga aktivasi retail, setiap langkah dirancang untuk menghasilkan kunjungan nyata dan konversi yang terukur.',
    features: [
      {
        icon: 'storefront',
        title: 'Aktivasi Retail & Event',
        description:
          'Konsep retail activation, booth, pop-up store, dan event experiential yang mengundang audiens untuk bertemu brand secara langsung.',
      },
      {
        icon: 'devices',
        title: 'Omnichannel Campaigns',
        description:
          'Integrasi iklan digital, sosial media, dan pengalaman offline untuk menumbuhkan kesadaran dan membawa audiens dari online ke store.',
      },
      {
        icon: 'insights',
        title: 'Data Aktif & Konversi',
        description:
          'Pelacakan real-time dan optimasi berbasis data untuk memastikan setiap interaksi online meningkatkan traffic offline dan penjualan.',
      },
    ],
    ctaTitle: 'Siap Mengubah Audiens Online Menjadi Pengunjung Offline?',
    ctaLabel: 'Diskusikan Aktivasi O2O Anda',
    navIcon: 'hub',
    navTitle: 'O2O Brand Experience',
    navDescription:
      'Integrasi strategi aktivasi online dan offline yang sinkron dan konsisten.',
  },
]

export const servicesService = {
  async getAll(): Promise<Service[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.docs.map((d) => d.data() as Service)
    } catch {
      return []
    }
  },

  async getBySlug(slug: string): Promise<Service | null> {
    const snap = await getDoc(doc(db, COL, slug))
    return snap.exists() ? (snap.data() as Service) : null
  },

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.docs.map((d) => d.id)
    } catch {
      return []
    }
  },

  async save(service: Service): Promise<void> {
    await setDoc(doc(db, COL, service.slug), { ...service })
  },

  async delete(slug: string): Promise<void> {
    await deleteDoc(doc(db, COL, slug))
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.size
    } catch { return 0 }
  },

  async seedDefaults(): Promise<boolean> {
    const snap = await getDocs(collection(db, COL))
    if (!snap.empty) return false
    await Promise.all(seedData.map((item) => setDoc(doc(db, COL, item.slug), { ...item })))
    return true
  },
}
