import {
  collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type NewsStatus = 'draft' | 'published'

export interface NewsArticle {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string
  category: string
  author: string
  status: NewsStatus
  publishedAt: string
  tags: string
}

const COL = 'news'

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
    tags: 'tren, video korporat, produksi',
  },
]

export const newsService = {
  async getAll(): Promise<NewsArticle[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('publishedAt', 'desc')))
      return snap.docs.map((d) => d.data() as NewsArticle)
    } catch {
      return []
    }
  },

  async getAllPublished(): Promise<NewsArticle[]> {
    const all = await this.getAll()
    return all.filter((n) => n.status === 'published')
  },

  async getBySlug(slug: string): Promise<NewsArticle | null> {
    const snap = await getDoc(doc(db, COL, slug))
    return snap.exists() ? (snap.data() as NewsArticle) : null
  },

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.docs.filter((d) => (d.data() as NewsArticle).status === 'published').map((d) => d.id)
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
