// One-time migration: renames the single portfolio slug that 404s in production
// (comma + multiple periods + trailing hyphen in an unusually long slug — the
// specific cause wasn't identified, but the fix that worked for the earlier
// "&"-slugs applies here too: clean, short, [a-z0-9-]-only slugs always work).
// Run locally: npx tsx scripts/fix-dprd-slug.ts --dry-run
// Then for real: npx tsx scripts/fix-dprd-slug.ts
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

const OLD_SLUG = 'multi-cam-dokumenrasi-sidang-terbuka-s3-ipb-dr.-atang-trisnanto-s.hut.,-m.si---ketua-dprd-kota-bogor-2019-2024-'
const NEW_SLUG = 'multi-cam-dokumenrasi-sidang-terbuka-s3-ipb-dr-atang-trisnanto-s-hut-m-si-ketua-dprd-kota-bogor-2019-2024'

function galleryDocId(slug: string, itemId: string) {
  return `portfolio-${slug}-${itemId}`
}

async function main() {
  const db = adminDb()

  const oldDoc = await db.collection('portfolio').doc(OLD_SLUG).get()
  if (!oldDoc.exists) {
    console.log('Doc lama tidak ditemukan, mungkin sudah pernah dimigrasi.')
    return
  }

  console.log(`"${OLD_SLUG}" -> "${NEW_SLUG}"`)

  const portfolioSnap = await db.collection('portfolio').get()
  const pointerFixes = portfolioSnap.docs.filter((d) => {
    const data = d.data()
    return data.prevSlug === OLD_SLUG || data.nextSlug === OLD_SLUG
  })
  if (pointerFixes.length > 0) {
    console.log('Pointer prevSlug/nextSlug yang juga perlu diupdate:')
    for (const d of pointerFixes) console.log(`  ${d.id}`)
  } else {
    console.log('Tidak ada pointer prevSlug/nextSlug lain yang mengarah ke slug ini.')
  }

  const gallerySnap = await db.collection('gallery').where('sourceSlug', '==', OLD_SLUG).get()
  console.log(`Dokumen gallery terkait: ${gallerySnap.size}`)

  if (DRY_RUN) {
    console.log('\n--dry-run aktif, tidak ada perubahan yang ditulis.')
    return
  }

  const data = { ...oldDoc.data(), slug: NEW_SLUG }
  await db.collection('portfolio').doc(NEW_SLUG).set(data)
  await db.collection('portfolio').doc(OLD_SLUG).delete()
  console.log('portfolio: migrated + deleted old')

  for (const d of pointerFixes) {
    const data = d.data()
    const updates: Record<string, string> = {}
    if (data.prevSlug === OLD_SLUG) updates.prevSlug = NEW_SLUG
    if (data.nextSlug === OLD_SLUG) updates.nextSlug = NEW_SLUG
    await db.collection('portfolio').doc(d.id).update(updates)
    console.log(`  ${d.id} pointer updated`)
  }

  for (const g of gallerySnap.docs) {
    const newId = galleryDocId(NEW_SLUG, g.data().sourceItemId)
    await db.collection('gallery').doc(newId).set({ ...g.data(), id: newId, sourceSlug: NEW_SLUG })
    await db.collection('gallery').doc(g.id).delete()
    console.log(`  gallery: "${g.id}" -> "${newId}"`)
  }

  console.log('\nSelesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
