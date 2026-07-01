import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Advantage {
  id: string
  icon: string
  title: string
  body: string
  order: number
}

const seedData: Advantage[] = [
  {
    id: 'precision',
    icon: 'target',
    title: 'Precision Execution',
    body: 'Kami menjamin proyek ditangani langsung oleh praktisi industri profesional--mulai dari sutradara, fotografer hingga pilot drone berlisensi, untuk memastikan hasil yang presisi dan berkualitas tinggi.',
    order: 1,
  },
  {
    id: 'creativity',
    icon: 'auto_awesome',
    title: 'Predictive Creativity',
    body: 'Kami tidak hanya mengandalkan intuisi. Setiap proses kreatif didukung oleh analisis tren berbasis AI guna menghasilkan konten yang tidak hanya estetik, tetapi juga akurat menembus algoritma pasar saat ini.',
    order: 2,
  },
  {
    id: 'ecosystem',
    icon: 'hub',
    title: 'Seamless Ecosystem',
    body: 'Sebagai agensi one-stop solution, kami menangani seluruh alur kerja mulai dari konsep, produksi audio-visual hingga manajemen iklan dalam satu ekosistem yang efisien dan terintegrasi.',
    order: 3,
  },
  {
    id: 'investment',
    icon: 'trending_up',
    title: 'Optimized Investment',
    body: 'Kami berkomitmen memberikan hasil kelas atas dengan skema harga yang tetap masuk akal. Efisiensi biaya terjadi karena seluruh aset produksi adalah milik sendiri (in-house), memastikan investasi Anda memberikan dampak maksimal.',
    order: 4,
  },
]

const COL = 'advantages'

export const advantagesService = {
  async getAll(): Promise<Advantage[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Advantage))
    } catch {
      return []
    }
  },

  async save(item: Advantage): Promise<void> {
    await setDoc(doc(db, COL, item.id), { ...item })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
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
    await Promise.all(seedData.map((item) => setDoc(doc(db, COL, item.id), { ...item })))
    return true
  },
}
