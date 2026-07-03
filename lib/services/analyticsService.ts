import {
  collection, addDoc, getDocs, getCountFromServer, serverTimestamp, query, orderBy, where, limit, Timestamp,
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
const RECENT_SAFETY_LIMIT = 5000

export const analyticsService = {
  async track(data: CreatePageViewInput): Promise<void> {
    await addDoc(collection(db, COL), {
      path: data.path,
      device: data.device,
      createdAt: serverTimestamp(),
    })
  },

  // Only pulls the window actually rendered (trend charts, today's count) instead of the whole collection.
  async getRecent(days = 14): Promise<PageView[]> {
    try {
      const cutoff = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000)
      const snap = await getDocs(
        query(collection(db, COL), where('createdAt', '>=', cutoff), orderBy('createdAt', 'desc'), limit(RECENT_SAFETY_LIMIT)),
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PageView))
    } catch {
      return []
    }
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(db, COL))
      return snap.data().count
    } catch { return 0 }
  },
}
