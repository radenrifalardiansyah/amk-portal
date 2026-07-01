import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Leader {
  id: string
  name: string
  role: string
  image: string
  order: number
  bio?: string
  email?: string
  phone?: string
  linkedin?: string
  instagram?: string
}

const staticData: Leader[] = [
  { id: 'rizqi',  name: 'Rizqi Maulana',  role: 'Leading Director',   image: '/images/risqi.jpeg',  order: 1 },
  { id: 'meida',  name: 'Meida Pitaloka', role: 'Commissioner',        image: '/images/meida.jpeg',  order: 2 },
  { id: 'luthfi', name: 'Luthfi Hafiz',   role: 'Head of Operations',  image: '/images/luthfi.jpeg', order: 3 },
]

const COL = 'leaders'

export const leadersService = {
  async getAll(): Promise<Leader[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      if (snap.empty) return staticData
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Leader))
    } catch {
      return staticData
    }
  },

  async save(item: Leader): Promise<void> {
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
}
