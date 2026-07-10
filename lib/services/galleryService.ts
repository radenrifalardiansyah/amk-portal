import {
  collection, getDocs, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface GalleryItem {
  id: string
  title: string
  type: 'image' | 'video'
  url: string
  order: number
}

const COL = 'gallery'

export const galleryService = {
  async getAll(): Promise<GalleryItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          title: data.title,
          type: data.type ?? 'image',
          url: data.url ?? data.image ?? '',
          order: data.order,
        } as GalleryItem
      })
    } catch {
      return []
    }
  },

  async save(item: GalleryItem): Promise<void> {
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

  newId(): string {
    return doc(collection(db, COL)).id
  },
}
