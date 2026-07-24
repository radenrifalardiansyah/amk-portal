import {
  collection, getDocs, getDoc, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { cache } from 'react'
import { db } from '@/lib/firebase'

export type NewsStatus = 'draft' | 'pending' | 'published'

export interface NewsArticle {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  /** Missing on legacy docs — treat as 'image' when absent. */
  imageType?: 'image' | 'video'
  category: string
  author: string
  status: NewsStatus
  publishedAt: string
  publishedTime: string
  tags: string
}

const COL = 'news'
const JAKARTA_TZ = 'Asia/Jakarta'

// Wall-clock "now" in WIB (UTC+7), independent of the server process's own
// timezone (Vercel serverless functions run in UTC) — this is what "today"
// and "this hour" mean to readers/admins, who are all in Indonesia.
export function jakartaNowInstant(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: JAKARTA_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  // Midnight renders as "24" with hour12: false in some engines; normalize to "00".
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`
}

// The article's scheduled publish instant, as a "YYYY-MM-DDTHH:mm" string
// comparable lexically with jakartaNowInstant().
export function publishInstant(article: Pick<NewsArticle, 'publishedAt' | 'publishedTime'>): string {
  return `${article.publishedAt}T${article.publishedTime || '00:00'}`
}

export function isVisible(article: NewsArticle): boolean {
  return article.status === 'published' && publishInstant(article) <= jakartaNowInstant()
}

// Shared "Senin, 10 November 2025 · 14.30 WIB" formatter so every portal view
// renders the same day-name/date/time, always in WIB regardless of the
// reader's own browser timezone.
export function formatPublishedAt(
  article: Pick<NewsArticle, 'publishedAt' | 'publishedTime'>,
  opts: { weekday?: boolean; month?: 'short' | 'long' } = {},
): string {
  const { weekday = true, month = 'long' } = opts
  const date = new Date(`${publishInstant(article)}:00+07:00`)
  if (Number.isNaN(date.getTime())) return article.publishedAt
  const dateStr = date.toLocaleDateString('id-ID', {
    ...(weekday ? { weekday: 'long' as const } : {}),
    day: 'numeric', month, year: 'numeric', timeZone: JAKARTA_TZ,
  })
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: JAKARTA_TZ, hour12: false })
  return `${dateStr} · ${timeStr} WIB`
}

const seedData: NewsArticle[] = [
  {
    slug: 'amk-raih-penghargaan-agensi-kreatif-2025',
    title: 'AMK Raih Penghargaan Agensi Kreatif Terbaik 2025',
    excerpt: 'PT. Adikara Mandala Kreasi dianugerahi sebagai agensi kreatif terbaik atas inovasi produksi audio-visual berbasis AI.',
    content: 'PT. Adikara Mandala Kreasi (AMK) kembali mencatatkan prestasi membanggakan dengan meraih penghargaan sebagai Agensi Kreatif Terbaik 2025 dari asosiasi industri kreatif nasional.\n\nPenghargaan ini diberikan atas dedikasi AMK dalam menghadirkan solusi produksi audio-visual yang memadukan kreativitas manusia dengan teknologi analisis tren berbasis AI, menghasilkan konten yang tidak hanya estetik tetapi juga efektif menembus algoritma pasar digital saat ini.\n\n"Pencapaian ini adalah hasil kerja keras seluruh tim yang terus berinovasi tanpa henti," ujar jajaran manajemen AMK dalam sambutannya. Ke depan, AMK berkomitmen untuk terus memperluas ekosistem layanan one-stop solution bagi para kliennya.',
    coverImage: '/images/company.png',
    category: 'Company News',
    author: 'Tim AMK',
    status: 'published',
    publishedAt: '2025-11-10',
    publishedTime: '09:00',
    tags: 'penghargaan, prestasi, agensi kreatif',
  },
  {
    slug: 'kolaborasi-strategis-jica-innovation-hub',
    title: 'AMK & JICA Luncurkan Program Innovation Hub untuk Anak Muda',
    excerpt: 'Kolaborasi strategis antara AMK dan JICA menghadirkan program pemberdayaan komunitas berbasis konten digital.',
    content: 'Dalam rangka mendukung pemberdayaan generasi muda Indonesia, PT. Adikara Mandala Kreasi menjalin kolaborasi strategis dengan Japan International Cooperation Agency (JICA) untuk meluncurkan program Innovation Hub.\n\nProgram ini dirancang dengan pendekatan storytelling berbasis dampak sosial, dikombinasikan dengan distribusi konten bilingual (Indonesia-Inggris) lintas platform digital untuk menjangkau audiens muda secara lebih luas dan relevan.\n\nSejak diluncurkan, program ini telah berhasil menarik perhatian ribuan pendaftar dari berbagai universitas terkemuka di Indonesia, membuktikan efektivitas strategi konten yang segar namun tetap mempertahankan citra kelembagaan yang prestisius.',
    coverImage: '/images/tech.png',
    category: 'Partnership',
    author: 'Tim AMK',
    status: 'published',
    publishedAt: '2025-09-22',
    publishedTime: '10:30',
    tags: 'jica, kolaborasi, pemberdayaan',
  },
  {
    slug: 'tren-produksi-video-korporat-2026',
    title: '5 Tren Produksi Video Korporat yang Wajib Diketahui di 2026',
    excerpt: 'Dari hyper-cinematic storytelling hingga AI-assisted editing, simak tren yang akan mendominasi industri video korporat.',
    content: 'Industri produksi video korporat terus berevolusi seiring perkembangan teknologi dan perubahan preferensi audiens. Berikut lima tren utama yang diprediksi akan mendominasi sepanjang 2026.\n\nPertama, pendekatan hyper-cinematic semakin banyak diadopsi untuk profil perusahaan berskala besar, memadukan drone footage beresolusi tinggi dengan color grading sinematik ala Hollywood.\n\nKedua, AI-assisted editing mempercepat proses pasca-produksi tanpa mengorbankan kualitas naratif. Ketiga, hybrid event coverage menjadi standar baru pasca pandemi. Keempat, storytelling berbasis data semakin diminati brand untuk memperkuat kredibilitas pesan. Kelima, konten vertikal short-form tetap menjadi kanal distribusi utama untuk menjangkau audiens digital.',
    coverImage: '/images/office.png',
    category: 'Insight',
    author: 'Tim Kreatif AMK',
    status: 'published',
    publishedAt: '2025-08-05',
    publishedTime: '08:00',
    tags: 'tren, video korporat, produksi',
  },
]

export const newsService = {
  async getAll(): Promise<NewsArticle[]> {
    try {
      // Sorted in-memory by full publish instant (date+time) rather than via a second
      // Firestore orderBy, which would require a composite index to be created first.
      const snap = await getDocs(query(collection(db, COL), orderBy('publishedAt', 'desc')))
      const articles = snap.docs.map((d) => d.data() as NewsArticle)
      return articles.sort((a, b) => publishInstant(b).localeCompare(publishInstant(a)))
    } catch {
      return []
    }
  },

  async getAllPublished(): Promise<NewsArticle[]> {
    const all = await this.getAll()
    return all.filter(isVisible)
  },

  getBySlug: cache(async (slug: string): Promise<NewsArticle | null> => {
    const snap = await getDoc(doc(db, COL, slug))
    return snap.exists() ? (snap.data() as NewsArticle) : null
  }),

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.docs.filter((d) => isVisible(d.data() as NewsArticle)).map((d) => d.id)
    } catch {
      return []
    }
  },

  async save(article: NewsArticle): Promise<void> {
    await setDoc(doc(db, COL, article.slug), { ...article })
  },

  async delete(slug: string): Promise<void> {
    await deleteDoc(doc(db, COL, slug))
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
