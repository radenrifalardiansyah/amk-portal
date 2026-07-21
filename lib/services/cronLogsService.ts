import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface CronLog {
  id: string
  job: string
  ranAt: string
  trigger: string
  status: 'success' | 'error'
  durationMs: number
  dueSlugs: string[]
  revalidatedPaths: string[]
  error?: string
}

const COL = 'cron_logs'

export const cronLogsService = {
  async getAll(max = 200): Promise<CronLog[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('ranAt', 'desc'), limit(max)))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CronLog))
    } catch {
      return []
    }
  },
}
