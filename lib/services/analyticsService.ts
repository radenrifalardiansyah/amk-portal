import {
  collection, addDoc, getDocs, serverTimestamp, query, orderBy, limit, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type DeviceType = 'desktop' | 'mobile'

export interface PageView {
  id: string
  path: string
  device: DeviceType
  createdAt: Timestamp | null
}

export type CreatePageViewInput = Pick<PageView, 'path' | 'device'>

const COL = 'pageViews'
const MAX_DOCS = 5000

export const analyticsService = {
  async track(data: CreatePageViewInput): Promise<void> {
    await addDoc(collection(db, COL), {
      path: data.path,
      device: data.device,
      createdAt: serverTimestamp(),
    })
  },

  async getAll(): Promise<PageView[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc'), limit(MAX_DOCS)))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageView))
    } catch {
      return []
    }
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.size
    } catch { return 0 }
  },
}
