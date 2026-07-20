import {
  collection, getDocs, getDoc, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy, where, limit,
} from 'firebase/firestore'
import { cache } from 'react'
import { db } from '@/lib/firebase'
import { PortfolioProject } from '@/data/portfolio'

const COL = 'portfolio'
const GALLERY_COL = 'gallery'

// Mirrors each project's "Project Gallery" photos/videos into the sitewide `gallery`
// collection, so the public Gallery page/section stays populated even while the admin
// Gallery menu is turned off. Only published projects are mirrored; draft/pending items
// are removed from `gallery` so unapproved content never leaks onto the public gallery.
function galleryDocId(slug: string, itemId: string) {
  return `portfolio-${slug}-${itemId}`
}

async function getNextGalleryOrder(): Promise<number> {
  try {
    const snap = await getDocs(query(collection(db, GALLERY_COL), orderBy('order', 'desc'), limit(1)))
    if (snap.empty) return 0
    const top = snap.docs[0].data().order
    return (typeof top === 'number' ? top : 0) + 1
  } catch {
    return 0
  }
}

async function syncGalleryItems(project: PortfolioProject): Promise<void> {
  const existingSnap = await getDocs(query(collection(db, GALLERY_COL), where('sourceSlug', '==', project.slug)))
  const existingById = new Map(existingSnap.docs.map((d) => [d.id, d.data()]))

  const items = project.status === 'published' ? (project.gallery ?? []) : []
  const keepIds = new Set(items.map((g) => galleryDocId(project.slug, g.id)))

  const deletions = existingSnap.docs.filter((d) => !keepIds.has(d.id)).map((d) => deleteDoc(d.ref))

  const needsNewOrder = items.some((g) => typeof existingById.get(galleryDocId(project.slug, g.id))?.order !== 'number')
  let nextOrder = needsNewOrder ? await getNextGalleryOrder() : 0

  const upserts = items.map((g) => {
    const id = galleryDocId(project.slug, g.id)
    const existingOrder = existingById.get(id)?.order
    const order = typeof existingOrder === 'number' ? existingOrder : nextOrder++
    return setDoc(doc(db, GALLERY_COL, id), {
      id, title: g.caption?.trim() || project.title, type: g.type, url: g.url, order,
      sourceSlug: project.slug, sourceItemId: g.id,
    })
  })

  await Promise.all([...deletions, ...upserts])
}

async function deleteSyncedGalleryItems(slug: string): Promise<void> {
  const existingSnap = await getDocs(query(collection(db, GALLERY_COL), where('sourceSlug', '==', slug)))
  await Promise.all(existingSnap.docs.map((d) => deleteDoc(d.ref)))
}

const seedData: PortfolioProject[] = [
  {
    slug: 'nippon',
    category: 'Cinematic Visuals',
    title: 'Nippon Express Global',
    description:
      'Menerjemahkan skala dan kecepatan raksasa logistik global ke dalam sebuah narasi visual yang sinematik dan memukau.',
    image: '/images/company.png',
    client: 'Nippon Express',
    services: 'Corporate Video, Drone Footage, Post-Production',
    year: '2025',
    challenge:
      'Nippon Express adalah salah satu perusahaan logistik terbesar di dunia. Tantangan utamanya adalah bagaimana menampilkan infrastruktur raksasa, operasi yang rumit, dan teknologi mutakhir mereka dalam sebuah video pendek yang tidak membosankan, melainkan mendebarkan dan elegan, serta mudah dipahami oleh pemangku kepentingan internasional.',
    solution:
      'Tim kami menggunakan pendekatan hyper-cinematic. Kami menerbangkan drone beresolusi tinggi di area pergudangan dan pelabuhan, dikombinasikan dengan teknik slow-motion darat untuk menangkap detail humanis dari para pekerja. Dipadukan dengan color grading bergaya teal-and-orange khas film Hollywood dan dentuman sonic branding yang solid.',
    result:
      'Video profil ini sukses meningkatkan konversi interaksi B2B dalam berbagai pameran internasional. Desain visual yang premium secara instan meningkatkan persepsi brand value Nippon Express di pasar Asia Tenggara.',
    status: 'published',
    prevSlug: null,
    nextSlug: 'aston',
    nextLabel: 'Aston Bogor',
  },
  {
    slug: 'aston',
    category: 'Brand Experience',
    title: 'Aston Bogor Hybrid Event',
    description:
      'Mengorkestrasikan pengalaman hybrid event kelas dunia yang menjembatani peserta online dan offline secara mulus.',
    image: '/images/office.png',
    client: 'Aston Bogor Hotel & Resort',
    services: 'Event Coverage, Live Streaming, Brand Experience',
    year: '2025',
    challenge:
      'Aston Bogor membutuhkan solusi hybrid event yang mampu menghadirkan pengalaman yang sama berkesan bagi peserta yang hadir secara fisik maupun yang bergabung secara virtual dari berbagai kota.',
    solution:
      'AMK merancang sistem multi-kamera dengan live streaming berkualitas broadcast, dikombinasikan dengan grafis interaktif real-time dan manajemen konten digital yang sinkron dengan agenda acara.',
    result:
      'Hybrid event berjalan tanpa hambatan teknis. Tingkat partisipasi virtual meningkat signifikan, dan klien mendapatkan rekaman berkualitas tinggi yang kemudian digunakan sebagai aset pemasaran jangka panjang.',
    status: 'published',
    prevSlug: 'nippon',
    nextSlug: 'jica',
    nextLabel: 'JICA Innovation Hub',
  },
  {
    slug: 'jica',
    category: 'Digital Strategy',
    title: 'JICA Innovation Hub',
    description:
      'Membangun narasi digital yang kuat untuk mendukung program inovasi dan pemberdayaan komunitas JICA di Indonesia.',
    image: '/images/tech.png',
    client: 'JICA (Japan International Cooperation Agency)',
    services: 'Digital Marketing, Content Creation, Social Media Strategy',
    year: '2024',
    challenge:
      'JICA memerlukan strategi komunikasi digital yang mampu menjangkau audiens muda Indonesia sekaligus mempertahankan citra kelembagaan internasional yang prestisius.',
    solution:
      'Kami merancang konten bilingual (Indonesia-Inggris) dengan tone yang segar dan menggunakan storytelling berbasis dampak sosial. Pendekatan ini dikombinasikan dengan distribusi lintas platform yang terukur.',
    result:
      'Jangkauan organik meningkat drastis dalam tiga bulan pertama kampanye. Program-program JICA berhasil menarik lebih banyak pendaftar muda berkualitas dari berbagai universitas terkemuka di Indonesia.',
    status: 'published',
    prevSlug: 'aston',
    nextSlug: null,
    nextLabel: null,
  },
]

// Docs saved before the `status` field existed have none — treat those as published
// so nothing already live disappears from the public site.
function normalizeStatus(data: PortfolioProject): PortfolioProject {
  return { ...data, status: data.status ?? 'published' }
}

export const portfolioService = {
  async getAll(): Promise<PortfolioProject[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('year', 'desc')))
      return snap.docs.map((d) => normalizeStatus(d.data() as PortfolioProject))
    } catch {
      return []
    }
  },

  async getAllPublished(): Promise<PortfolioProject[]> {
    const all = await this.getAll()
    return all.filter((p) => p.status === 'published')
  },

  getBySlug: cache(async (slug: string): Promise<PortfolioProject | null> => {
    const snap = await getDoc(doc(db, COL, slug))
    return snap.exists() ? normalizeStatus(snap.data() as PortfolioProject) : null
  }),

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.docs.filter((d) => normalizeStatus(d.data() as PortfolioProject).status === 'published').map((d) => d.id)
    } catch {
      return []
    }
  },

  async save(project: PortfolioProject): Promise<void> {
    await setDoc(doc(db, COL, project.slug), { ...project })
    await syncGalleryItems(project)
  },

  async delete(slug: string): Promise<void> {
    await deleteDoc(doc(db, COL, slug))
    await deleteSyncedGalleryItems(slug)
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(db, COL))
      return snap.data().count
    } catch { return 0 }
  },

  async seedDefaults(): Promise<boolean> {
    const snap = await getDocs(collection(db, COL))
    if (!snap.empty) return false
    await Promise.all(seedData.map((item) => setDoc(doc(db, COL, item.slug), { ...item })))
    return true
  },
}
