import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const privateKey = privateKeyRaw?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin env vars are missing (FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY_BASE64)')
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())
export const adminMessaging = () => getMessaging(getAdminApp())
