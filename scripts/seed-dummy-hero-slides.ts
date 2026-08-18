// One-time: seeds 3 dummy Hero Slider slides so the new slider can be previewed
// on the homepage right away, reusing existing local images in public/images
// (no Cloudinary upload needed for these placeholders). Replace/edit them for
// real content anytime via Admin -> Hero Slider.
// Run: npx tsx scripts/seed-dummy-hero-slides.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { adminDb } from '../lib/firebaseAdmin'

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    console.warn('Tidak menemukan .env.local di root project - pastikan env vars sudah di-set manual.')
  }
}

loadEnvLocal()

const DEFAULT_TITLE_SIZE = 'text-6xl md:text-8xl'

const DUMMY_SLIDES = [
  {
    order: 1,
    badge: 'AMK Agency | Creative & Tech',
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
    imageType: 'image' as const,
  },
  {
    order: 2,
    badge: 'Creative Production',
    titleLine1: 'Cerita Visual',
    titleLine2: 'Yang',
    titleLine3: 'Berkesan',
    description:
      'Dari konsep hingga produksi, tim kreatif kami menghadirkan video, foto, dan konten yang membangun koneksi nyata dengan audiens brand Anda.',
    primaryCtaLabel: 'Lihat Portfolio',
    primaryCtaHref: '/portfolio',
    secondaryCtaLabel: 'Hubungi Kami',
    secondaryCtaHref: '/#contact',
    image: '/images/office.png',
    imageType: 'image' as const,
  },
  {
    order: 3,
    badge: 'AI & Data Driven',
    titleLine1: 'Teknologi',
    titleLine2: 'Untuk',
    titleLine3: 'Pertumbuhan',
    description:
      'Memadukan kekuatan AI dan analisis data untuk strategi kampanye yang lebih tepat sasaran, terukur, dan siap beradaptasi dengan tren digital terbaru.',
    primaryCtaLabel: 'Konsultasi Gratis',
    primaryCtaHref: '/#contact',
    secondaryCtaLabel: 'Tentang Kami',
    secondaryCtaHref: '/about',
    image: '/images/tech.png',
    imageType: 'image' as const,
  },
]

async function main() {
  const db = adminDb()

  const existing = await db.collection('hero_slides').get()
  if (!existing.empty) {
    console.log(`hero_slides sudah berisi ${existing.size} dokumen, dilewati supaya tidak duplikat.`)
    return
  }

  for (const slide of DUMMY_SLIDES) {
    const ref = db.collection('hero_slides').doc()
    const doc = {
      id: ref.id,
      order: slide.order,
      badge: slide.badge,
      titleLine1: slide.titleLine1,
      titleLine2: slide.titleLine2,
      titleLine3: slide.titleLine3,
      titleLine1Size: DEFAULT_TITLE_SIZE,
      titleLine2Size: DEFAULT_TITLE_SIZE,
      titleLine3Size: DEFAULT_TITLE_SIZE,
      description: slide.description,
      primaryCtaLabel: slide.primaryCtaLabel,
      primaryCtaHref: slide.primaryCtaHref,
      secondaryCtaLabel: slide.secondaryCtaLabel,
      secondaryCtaHref: slide.secondaryCtaHref,
      image: slide.image,
      imageType: slide.imageType,
    }
    await ref.set(doc)
    console.log(`Slide #${slide.order} ditambahkan: "${slide.titleLine1} ${slide.titleLine2} ${slide.titleLine3}" (id: ${ref.id})`)
  }

  console.log('\nSelesai. Cek homepage - hero sekarang jadi slider dengan 3 slide dummy ini.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
