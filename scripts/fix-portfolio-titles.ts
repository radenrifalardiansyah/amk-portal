// One-time fix: 32 portfolio documents have `title` set to whitespace-only
// text (a past migration apparently wiped the title but kept the slug, which
// still holds the descriptive text in slugified form). This derives a
// best-effort human-readable title from each blank doc's slug and writes it
// back. Auto-generated titles are approximate (acronym/brand capitalization
// won't always be right) — review the printed before/after list afterward
// and touch up any of them via the Portfolio admin page.
// Run: npx tsx scripts/fix-portfolio-titles.ts
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

const SMALL_WORDS = new Set(['dan', 'di', 'ke', 'dari', 'untuk', 'yang', 'atau', 'pada', 'dengan', 'para'])

function capitalizeWord(word: string): string {
  return word.replace(/^([^a-zA-Z]*)([a-zA-Z])/, (_m, pre, letter) => pre + letter.toUpperCase())
}

function slugToTitle(slug: string): string {
  const trimmed = slug.replace(/^-+|-+$/g, '')
  const parts = trimmed.split(/-+/).filter(Boolean)
  return parts
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : capitalizeWord(word)))
    .join(' ')
}

async function main() {
  const db = adminDb()
  const snap = await db.collection('portfolio').get()
  const blank = snap.docs.filter((d) => !String(d.data().title ?? '').trim())

  if (blank.length === 0) {
    console.log('Tidak ada portfolio dengan title kosong.')
    return
  }

  console.log(`Memperbaiki ${blank.length} title portfolio yang kosong:\n`)
  for (const d of blank) {
    const newTitle = slugToTitle(d.id)
    console.log(`  "${d.id}"\n    -> "${newTitle}"`)
    await db.collection('portfolio').doc(d.id).update({ title: newTitle })
  }

  console.log('\nSelesai. Cek kembali hasilnya di halaman admin Portfolio, perbaiki manual kapitalisasi singkatan/nama brand yang kurang pas.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
