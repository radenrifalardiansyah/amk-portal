import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore'
import { deleteToken, getToken, getMessaging, isSupported } from 'firebase/messaging'
import { app, db } from '@/lib/firebase'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export type NotificationPermissionState = 'unsupported' | 'default' | 'denied' | 'granted'

const COL = 'fcm_tokens'

export const notificationService = {
  async getState(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    if (!(await isSupported())) return 'unsupported'
    return Notification.permission as NotificationPermissionState
  },

  async enable(email: string): Promise<{ ok: boolean; error?: string }> {
    if (!VAPID_KEY) return { ok: false, error: 'VAPID key belum dikonfigurasi di server' }
    if (!(await isSupported())) return { ok: false, error: 'Browser ini tidak mendukung push notification' }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, error: 'Izin notifikasi ditolak' }

    try {
      const registration = await navigator.serviceWorker.register('/admin-sw.js')
      await navigator.serviceWorker.ready
      const messaging = getMessaging(app)
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
      if (!token) return { ok: false, error: 'Gagal membuat token notifikasi' }

      await setDoc(doc(db, COL, email), { tokens: arrayUnion(token), updatedAt: new Date().toISOString() }, { merge: true })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi' }
    }
  },

  async disable(email: string): Promise<void> {
    if (!VAPID_KEY) return
    try {
      const registration = await navigator.serviceWorker.getRegistration('/admin-sw.js')
      if (!registration) return
      const messaging = getMessaging(app)
      const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration }).catch(() => null)
      if (token) {
        await setDoc(doc(db, COL, email), { tokens: arrayRemove(token) }, { merge: true })
        await deleteToken(messaging).catch(() => {})
      }
    } catch {}
  },
}
