// Read-only check: lists portfolio/news documents with a blank/missing title.
// These feed the dashboard's "Top Portfolio"/"Top News" bar charts by slug ->
// title lookup; a blank title shows up as an empty-label bar in that chart.
// Run: npx tsx scripts/check-empty-titles.ts
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

async function main() {
  const db = adminDb()

  for (const col of ['portfolio', 'news'] as const) {
    const snap = await db.collection(col).get()
    const blank = snap.docs.filter((d) => !String(d.data().title ?? '').trim())
    console.log(`\n${col}: ${snap.size} dokumen total, ${blank.length} dengan title kosong`)
    for (const d of blank) {
      const data = d.data()
      console.log(`  - id/slug: "${d.id}" | status: ${data.status ?? '(tanpa field status)'} | title: ${JSON.stringify(data.title)}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
