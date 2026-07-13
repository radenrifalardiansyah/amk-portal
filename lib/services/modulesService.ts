import {
  collection, getDocs, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AdminModule {
  id: string
  label: string
  order: number
}

const COL = 'modules'

const seedData: AdminModule[] = [
  { id: 'utama', label: 'Utama', order: 1 },
  { id: 'konten-website', label: 'Konten Website', order: 2 },
  { id: 'sistem', label: 'Sistem', order: 3 },
  { id: 'akun', label: 'Akun', order: 4 },
]

export const modulesService = {
  async getAll(): Promise<AdminModule[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => d.data() as AdminModule)
    } catch {
      return []
    }
  },

  async save(module: AdminModule): Promise<void> {
    await setDoc(doc(db, COL, module.id), { ...module })
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
    await Promise.all(seedData.map((m) => setDoc(doc(db, COL, m.id), { ...m })))
    return true
  },
}
