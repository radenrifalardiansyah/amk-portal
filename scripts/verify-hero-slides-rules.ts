// Verifies the published firestore.rules actually allow public (unauthenticated)
// read access to the new `hero_slides` collection, using the CLIENT SDK (not
// admin, which bypasses rules entirely) so this reflects what a real visitor's
// browser would experience.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    console.warn('Tidak menemukan .env.local di root project - pastikan env vars sudah di-set manual.')
  }
}

loadEnvLocal()

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function main() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  try {
    const snap = await getDocs(collection(db, 'hero_slides'))
    console.log(`OK - rules mengizinkan baca publik. Jumlah dokumen hero_slides saat ini: ${snap.size}`)
  } catch (err) {
    console.error('GAGAL - rules belum mengizinkan baca publik:', err)
    process.exit(1)
  }
}

main()
