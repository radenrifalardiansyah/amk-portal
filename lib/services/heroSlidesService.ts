import {
  collection, getDocs, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const DEFAULT_HERO_TITLE_SIZE = 'text-6xl md:text-8xl'
const DEFAULT_TITLE_SIZE = DEFAULT_HERO_TITLE_SIZE

export interface HeroSlide {
  id: string
  order: number
  badge: string
  titleLine1: string
  titleLine2: string
  titleLine3: string
  titleLine1Size: string
  titleLine2Size: string
  titleLine3Size: string
  description: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  image: string
  imageType: 'image' | 'video'
}

const COL = 'hero_slides'

export const heroSlidesService = {
  async getAll(): Promise<HeroSlide[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          order: data.order ?? 0,
          badge: data.badge ?? '',
          titleLine1: data.titleLine1 ?? '',
          titleLine2: data.titleLine2 ?? '',
          titleLine3: data.titleLine3 ?? '',
          titleLine1Size: data.titleLine1Size ?? DEFAULT_TITLE_SIZE,
          titleLine2Size: data.titleLine2Size ?? DEFAULT_TITLE_SIZE,
          titleLine3Size: data.titleLine3Size ?? DEFAULT_TITLE_SIZE,
          description: data.description ?? '',
          primaryCtaLabel: data.primaryCtaLabel ?? '',
          primaryCtaHref: data.primaryCtaHref ?? '',
          secondaryCtaLabel: data.secondaryCtaLabel ?? '',
          secondaryCtaHref: data.secondaryCtaHref ?? '',
          image: data.image ?? '',
          imageType: data.imageType ?? 'image',
        } as HeroSlide
      })
    } catch {
      return []
    }
  },

  async save(item: HeroSlide): Promise<void> {
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
