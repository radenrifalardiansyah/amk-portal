// One-time migration: renames portfolio slugs that contain "&" (invalid in sitemap.xml
// <loc> text nodes, breaks Google Search Console's sitemap parser). Renaming a slug means
// creating a new doc under the clean id, migrating its synced gallery items, fixing any
// other project's prevSlug/nextSlug pointer, then deleting the old doc.
// Run locally: npx tsx scripts/fix-portfolio-slugs.ts --dry-run
// Then for real: npx tsx scripts/fix-portfolio-slugs.ts
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

const DRY_RUN = process.argv.includes('--dry-run')

function fixSlug(slug: string): string {
  return slug
    .replace(/&/g, 'dan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function galleryDocId(slug: string, itemId: string) {
  return `portfolio-${slug}-${itemId}`
}

async function main() {
  const db = adminDb()
  const portfolioSnap = await db.collection('portfolio').get()

  const renames = new Map<string, string>()
  for (const d of portfolioSnap.docs) {
    if (d.id.includes('&')) renames.set(d.id, fixSlug(d.id))
  }

  if (renames.size === 0) {
    console.log('Tidak ada slug portfolio yang mengandung "&". Tidak ada yang perlu diperbaiki.')
    return
  }

  console.log(`Ditemukan ${renames.size} slug yang perlu diperbaiki:`)
  for (const [oldSlug, newSlug] of renames) console.log(`  "${oldSlug}" -> "${newSlug}"`)

  // Any OTHER project's prevSlug/nextSlug pointing at a renamed slug must follow the rename.
  const pointerFixes: { docId: string; field: 'prevSlug' | 'nextSlug'; from: string; to: string }[] = []
  for (const d of portfolioSnap.docs) {
    const data = d.data()
    for (const field of ['prevSlug', 'nextSlug'] as const) {
      const value = data[field]
      if (typeof value === 'string' && renames.has(value)) {
        pointerFixes.push({ docId: d.id, field, from: value, to: renames.get(value)! })
      }
    }
  }
  if (pointerFixes.length > 0) {
    console.log(`\nPointer prevSlug/nextSlug di project lain yang juga perlu diupdate:`)
    for (const p of pointerFixes) console.log(`  ${p.docId}.${p.field}: "${p.from}" -> "${p.to}"`)
  }

  const gallerySnap = await db.collection('gallery').get()
  const galleryMigrations = gallerySnap.docs.filter((d) => renames.has(d.data().sourceSlug))
  if (galleryMigrations.length > 0) {
    console.log(`\nDokumen gallery yang juga ikut dimigrasi:`)
    for (const g of galleryMigrations) {
      const oldSourceSlug = g.data().sourceSlug
      console.log(`  ${g.id} (sourceSlug: ${oldSourceSlug} -> ${renames.get(oldSourceSlug)})`)
    }
  }

  if (DRY_RUN) {
    console.log('\n--dry-run aktif, tidak ada perubahan yang ditulis.')
    return
  }

  console.log('\nMenjalankan migrasi...')

  for (const [oldSlug, newSlug] of renames) {
    const oldDoc = portfolioSnap.docs.find((d) => d.id === oldSlug)!
    const data = { ...oldDoc.data(), slug: newSlug }
    await db.collection('portfolio').doc(newSlug).set(data)
    await db.collection('portfolio').doc(oldSlug).delete()
    console.log(`  portfolio: "${oldSlug}" -> "${newSlug}" (migrated + deleted old)`)
  }

  for (const p of pointerFixes) {
    await db.collection('portfolio').doc(p.docId).update({ [p.field]: p.to })
    console.log(`  ${p.docId}.${p.field} updated to "${p.to}"`)
  }

  for (const g of galleryMigrations) {
    const oldSourceSlug = g.data().sourceSlug
    const newSourceSlug = renames.get(oldSourceSlug)!
    const newId = galleryDocId(newSourceSlug, g.data().sourceItemId)
    await db.collection('gallery').doc(newId).set({ ...g.data(), id: newId, sourceSlug: newSourceSlug })
    await db.collection('gallery').doc(g.id).delete()
    console.log(`  gallery: "${g.id}" -> "${newId}"`)
  }

  console.log('\nSelesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
