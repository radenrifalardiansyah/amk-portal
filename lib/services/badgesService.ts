import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Badge {
  id: string
  name: string
  order: number
}

const seedData: Badge[] = [
  { id: 'core-pillar', name: 'Core Pillar', order: 1 },
  { id: 'ai-creative', name: 'AI Creative', order: 2 },
  { id: 'o2o-brand', name: 'O2O Brand', order: 3 },
]

const COL = 'badges'

export const badgesService = {
  async getAll(): Promise<Badge[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Badge))
    } catch {
      return []
    }
  },

  async save(item: Badge): Promise<void> {
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
