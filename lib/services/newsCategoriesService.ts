import {
  collection, getDocs, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface NewsCategory {
  id: string
  name: string
  order: number
}

const seedData: NewsCategory[] = [
  { id: 'company-news', name: 'Company News', order: 1 },
  { id: 'partnership', name: 'Partnership', order: 2 },
  { id: 'event', name: 'Event', order: 3 },
  { id: 'press-release', name: 'Press Release', order: 4 },
  { id: 'insight', name: 'Insight', order: 5 },
  { id: 'achievement', name: 'Achievement', order: 6 },
]

const COL = 'news_categories'

export const newsCategoriesService = {
  async getAll(): Promise<NewsCategory[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsCategory))
    } catch {
      return []
    }
  },

  async save(item: NewsCategory): Promise<void> {
    await setDoc(doc(db, COL, item.id), { ...item })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
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
    await Promise.all(seedData.map((item) => setDoc(doc(db, COL, item.id), { ...item })))
    return true
  },
}
