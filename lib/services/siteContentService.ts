import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface HeroContent {
  badge: string
  titleLine1: string
  titleLine2: string
  titleLine3: string
  description: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  image: string
}

export interface AboutHomeContent {
  heading: string
  paragraph: string
  nib: string
  address: string
  stat1Value: string
  stat1Label: string
  stat2Value: string
  stat2Label: string
  videoSrc: string
  teamImage: string
}

export interface BusinessUnit {
  code: string
  title: string
  desc: string
}

export interface AboutPageContent {
  badge: string
  heroTitle: string
  heroDescription: string
  visionTitle: string
  visionText: string
  missionTitle: string
  missionIntro: string
  missions: string[]
  businessUnitsTitle: string
  businessUnitsIntro: string
  businessUnits: BusinessUnit[]
}

export interface ContactContent {
  heading: string
  description: string
  waNumber: string
  waResponseTitle: string
  waResponseSubtitle: string
  serviceOptions: string[]
}

export interface CompanyProfile {
  legalName: string
  shortName: string
  tagline: string
  logoUrl: string
  address: string
  email: string
  phone: string
  instagramUrl: string
  linkedinUrl: string
  copyrightText: string
}

const COL = 'site_content'

const empty = {
  hero: {
    badge: '', titleLine1: '', titleLine2: '', titleLine3: '', description: '',
    primaryCtaLabel: '', primaryCtaHref: '', secondaryCtaLabel: '', secondaryCtaHref: '', image: '',
  } as HeroContent,
  aboutHome: {
    heading: '', paragraph: '', nib: '', address: '',
    stat1Value: '', stat1Label: '', stat2Value: '', stat2Label: '', videoSrc: '', teamImage: '',
  } as AboutHomeContent,
  aboutPage: {
    badge: '', heroTitle: '', heroDescription: '', visionTitle: '', visionText: '',
    missionTitle: '', missionIntro: '', missions: [], businessUnitsTitle: '', businessUnitsIntro: '', businessUnits: [],
  } as AboutPageContent,
  contact: {
    heading: '', description: '', waNumber: '', waResponseTitle: '', waResponseSubtitle: '', serviceOptions: [],
  } as ContactContent,
  company: {
    legalName: '', shortName: '', tagline: '', logoUrl: '', address: '', email: '', phone: '',
    instagramUrl: '', linkedinUrl: '', copyrightText: '',
  } as CompanyProfile,
}

const seedData = {
  hero: {
    badge: 'Creative Digital Agency Bogor',
    titleLine1: 'Collaboration',
    titleLine2: 'Meets',
    titleLine3: 'Innovation',
    description:
      'Digital Creative Agency inovatif di Bogor sebagai One-Stop Solution untuk estetika visual, produksi video sinematik, dan strategi pemasaran berbasis data.',
    primaryCtaLabel: 'Mulai Kolaborasi',
    primaryCtaHref: '/#contact',
    secondaryCtaLabel: 'Explore Services',
    secondaryCtaHref: '/#services',
    image: '/images/company.png',
  } as HeroContent,

  aboutHome: {
    heading: 'The Architects of Experience',
    paragraph:
      'PT. Adikara Mandala Kreasi (AMK) lahir dari visi untuk menyatukan presisi teknis dengan estetika yang tak terbatas. Kami bukan sekadar agensi; kami adalah mitra strategis yang menerjemahkan ambisi bisnis Anda menjadi realitas digital yang memukau.',
    nib: 'NIB: 2407250043491',
    address: 'Jl. Ring Road Jl. Raya Bubulak No.A-4, Kota Bogor.',
    stat1Value: '100+',
    stat1Label: 'Projects Delivered',
    stat2Value: '2026',
    stat2Label: 'Future Ready',
    videoSrc: '/videos/logo_videos.mp4',
    teamImage: '/images/teamwork.png',
  } as AboutHomeContent,

  aboutPage: {
    badge: 'Tentang AMK',
    heroTitle: 'Visi, Misi, dan Unit Bisnis PT. Adikara Mandala Kreasi',
    heroDescription:
      'Kami hadir sebagai mitra kreatif yang membangun pengalaman brand menyeluruh melalui produksi video, pemasaran digital, branding, audio, dan solusi AI yang menciptakan dampak nyata.',
    visionTitle: 'Visi Kami',
    visionText:
      'Menjadi ekosistem kreatif digital terintegrasi terdepan di Indonesia yang secara harmonis menyatukan seni visual, teknologi data, dan strategi komunikasi tingkat tinggi untuk memberdayakan brand serta para kreator di skala global.',
    missionTitle: 'Misi Kami',
    missionIntro:
      'Kami berfokus pada eksekusi kreatif yang terukur, kolaborasi yang personal, dan solusi end-to-end untuk membantu setiap brand mencapai tujuan bisnisnya.',
    missions: [
      'Kami fokus memproduksi karya visual premium, seperti foto, film, video dan musik dengan standar estetika tinggi yang diperkuat oleh kekuatan storytelling yang mendalam.',
      'Secara konsisten mengimplementasikan teknologi mutakhir seperti AI dan Data-Driven Marketing ke dalam setiap strategi kampanye untuk memastikan hasil yang inovatif dan terukur bagi klien.',
      'Membangun ekosistem bisnis yang sehat dan berkelanjutan bagi para Key Partners serta talenta kreatif melalui sistem manajemen yang transparan dan profesional.',
      'Memberikan dampak nyata dengan menyediakan platform distribusi serta eksibisi yang inklusif bagi karya-karya lokal agar dapat bersaing di kancah yang lebih luas.',
    ],
    businessUnitsTitle: 'Unit Bisnis Kami',
    businessUnitsIntro:
      'PT. Adikara Mandala Kreasi (AMK) didukung oleh legalitas hukum yang kuat di berbagai sektor strategis industri kreatif. Kami mengintegrasikan kreatifitas tradisional dengan teknologi masa depan melalui klasifikasi usaha dengan KLBI berikut:',
    businessUnits: [
      { code: '59122', title: 'Production House & Digital Content', desc: 'Fokus pada produksi film, iklan, dan konten digital berkualitas tinggi.' },
      { code: '73100', title: 'Integrated Advertising Planning', desc: 'Perencanaan iklan terpadu secara online maupun offline.' },
      { code: '59201', title: 'Audio Production & Podcasting', desc: 'Layanan audio profesional, podcast, hingga dubbing.' },
      { code: '60202', title: 'TV Program Provision', desc: 'Penyediaan konten kreatif untuk program televisi.' },
      { code: '59132', title: 'Broadcasting Rights & Licensing', desc: 'Lisensi hak tayang untuk platform OTT dan Bioskop.' },
      { code: '59202', title: 'Copyright Management', desc: 'Pengelolaan hak cipta dan publishing.' },
      { code: '59140', title: 'Modern Mobile Cinema', desc: 'Eksibisi film dan non-bioskop atau layar tancap modern.' },
      { code: '46412', title: 'Merchandise & Uniform', desc: 'Produksi serta distribusi merchandise dan uniform / seragam korporat.' },
      { code: '63111', title: 'AI & Data for Creative Strategy', desc: 'Pemanfaatan teknologi AI dan analisis data untuk strategi kreatif yang terukur.' },
    ],
  } as AboutPageContent,

  contact: {
    heading: 'Mari Berkarya Bersama',
    description:
      'Punya ide proyek luar biasa atau butuh konsultasi terkait strategi digital Anda? Jangan ragu untuk menyapa kami.',
    waNumber: '6285155336838',
    waResponseTitle: 'Respon Cepat via WhatsApp',
    waResponseSubtitle: 'Kami biasanya membalas dalam waktu 1 jam kerja.',
    serviceOptions: [
      'Cinematic Visuals (Video Produksi)',
      'Pro Audio (Podcast/Sonic Branding)',
      'Data-Driven Marketing (Precision Growth)',
      'AI Creative Assistant (Market Intelligence)',
      'O2O Brand Experience (Hybrid Activation)',
      'Konsultasi Umum / Lainnya',
    ],
  } as ContactContent,

  company: {
    legalName: 'PT. Adikara Mandala Kreasi',
    shortName: 'AMK',
    tagline: 'Transformasi digital melalui kreativitas berbasis data. Kami hadir di Bogor untuk jangkauan global.',
    logoUrl: '/images/logo.png',
    address: 'Jl. Ring Road Jl. Raya Bubulak No.A-4, Kota Bogor.',
    email: 'adikaramandalakreasi@gmail.com',
    phone: '6285155336838',
    instagramUrl: '',
    linkedinUrl: '',
    copyrightText: 'PT. Adikara Mandala Kreasi - All rights reserved.',
  } as CompanyProfile,
}

async function getContent<T>(key: string, fallback: T): Promise<T> {
  try {
    const snap = await getDoc(doc(db, COL, key))
    if (!snap.exists()) return fallback
    return { ...fallback, ...snap.data() } as T
  } catch {
    return fallback
  }
}

async function saveContent<T extends object>(key: string, data: T): Promise<void> {
  await setDoc(doc(db, COL, key), { ...data })
}

export const siteContentService = {
  getHero: () => getContent<HeroContent>('hero', empty.hero),
  saveHero: (data: HeroContent) => saveContent('hero', data),

  getAboutHome: () => getContent<AboutHomeContent>('aboutHome', empty.aboutHome),
  saveAboutHome: (data: AboutHomeContent) => saveContent('aboutHome', data),

  getAboutPage: () => getContent<AboutPageContent>('aboutPage', empty.aboutPage),
  saveAboutPage: (data: AboutPageContent) => saveContent('aboutPage', data),

  getContact: () => getContent<ContactContent>('contact', empty.contact),
  saveContact: (data: ContactContent) => saveContent('contact', data),

  getCompany: () => getContent<CompanyProfile>('company', empty.company),
  saveCompany: (data: CompanyProfile) => saveContent('company', data),

  async seedDefaults(): Promise<{ key: string; seeded: boolean }[]> {
    const keys = ['hero', 'aboutHome', 'aboutPage', 'contact', 'company'] as const
    const results: { key: string; seeded: boolean }[] = []
    for (const key of keys) {
      const snap = await getDoc(doc(db, COL, key))
      if (snap.exists()) {
        results.push({ key, seeded: false })
        continue
      }
      await saveContent(key, seedData[key])
      results.push({ key, seeded: true })
    }
    return results
  },
}
