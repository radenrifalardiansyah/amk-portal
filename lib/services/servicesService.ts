import {
  collection, getDocs, getDoc, doc, setDoc, deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Service, services as staticData } from '@/data/services'

const COL = 'services'

export const servicesService = {
  async getAll(): Promise<Service[]> {
    const snap = await getDocs(collection(db, COL))
    if (snap.empty) return staticData
    return snap.docs.map((d) => d.data() as Service)
  },

  async getBySlug(slug: string): Promise<Service | null> {
    const snap = await getDoc(doc(db, COL, slug))
    if (!snap.exists()) return staticData.find((s) => s.slug === slug) ?? null
    return snap.data() as Service
  },

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      if (snap.empty) return staticData.map((s) => s.slug)
      return snap.docs.map((d) => d.id)
    } catch {
      return staticData.map((s) => s.slug)
    }
  },

  async save(service: Service): Promise<void> {
    await setDoc(doc(db, COL, service.slug), { ...service })
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
}
