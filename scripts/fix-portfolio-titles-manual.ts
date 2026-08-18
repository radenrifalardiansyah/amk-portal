// Manual touch-up for 3 auto-generated portfolio titles (see fix-portfolio-titles.ts)
// where the slug-derived capitalization didn't match the real acronym/brand name.
// Run: npx tsx scripts/fix-portfolio-titles-manual.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { adminDb } from '../lib/firebaseAdmin'

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

const FIXES: Record<string, string> = {
  'video-profile-fkui': 'Video Profile FKUI',
  'dokumetasi-family-gathering-bank-uob': 'Dokumentasi Family Gathering Bank UOB',
  'profile-dokter-emc-hospital': 'Profile Dokter EMC Hospital',
}

async function main() {
  const db = adminDb()
  for (const [slug, newTitle] of Object.entries(FIXES)) {
    const doc = await db.collection('portfolio').doc(slug).get()
    if (!doc.exists) {
      console.log(`  [SKIP] "${slug}" tidak ditemukan`)
      continue
    }
    const oldTitle = doc.data()?.title
    await db.collection('portfolio').doc(slug).update({ title: newTitle })
    console.log(`  "${slug}": "${oldTitle}" -> "${newTitle}"`)
  }
  console.log('\nSelesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
