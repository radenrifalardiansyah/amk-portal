// One-time migration: uploads every base64 image currently embedded in Firestore
// documents to Cloudinary, then rewrites the field to the returned secure_url.
// Run locally (NOT part of build/deploy): npx tsx scripts/migrate-images-to-cloudinary.ts
// Add --dry-run to only report what would change, without writing anything.
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

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const DRY_RUN = process.argv.includes('--dry-run')

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET belum di-set di .env.local')
  process.exit(1)
}

const stats = { migrated: 0, skipped: 0, failed: 0 }

function isBase64Image(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image/')
}

async function uploadBase64ToCloudinary(dataUri: string, folder: string): Promise<string> {
  const form = new FormData()
  form.append('file', dataUri)
  form.append('upload_preset', UPLOAD_PRESET as string)
  form.append('folder', folder)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`)
  }
  return data.secure_url as string
}

async function migrateField(label: string, folder: string, value: unknown, apply: (url: string) => Promise<void>) {
  if (!isBase64Image(value)) {
    stats.skipped++
    return
  }
  if (DRY_RUN) {
    console.log(`[dry-run] would migrate ${label} (folder: ${folder})`)
    stats.migrated++
    return
  }
  try {
    const url = await uploadBase64ToCloudinary(value, folder)
    await apply(url)
    stats.migrated++
    console.log(`OK   ${label}`)
  } catch (err) {
    stats.failed++
    console.error(`FAIL ${label}:`, (err as Error).message)
  }
}

async function migrateCollectionField(collectionName: string, field: string, folder: string) {
  const db = adminDb()
  const snap = await db.collection(collectionName).get()
  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    await migrateField(
      `${collectionName}/${docSnap.id}.${field}`,
      folder,
      data[field],
      async (url) => { await docSnap.ref.update({ [field]: url }) },
    )
  }
}

async function migrateSiteContentField(docId: string, field: string, folder: string) {
  const db = adminDb()
  const ref = db.collection('site_content').doc(docId)
  const snap = await ref.get()
  if (!snap.exists) return
  await migrateField(
    `site_content/${docId}.${field}`,
    folder,
    snap.data()?.[field],
    async (url) => { await ref.update({ [field]: url }) },
  )
}

async function migrateGallery() {
  const db = adminDb()
  const snap = await db.collection('gallery').get()
  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    if (data.type !== 'image') { stats.skipped++; continue }
    await migrateField(
      `gallery/${docSnap.id}.url`,
      'gallery',
      data.url,
      async (url) => { await docSnap.ref.update({ url }) },
    )
  }
}

async function migrateKeyPartners() {
  const db = adminDb()
  const snap = await db.collection('keyPartners').get()
  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const members = Array.isArray(data.members) ? data.members : []
    let changed = false
    const newMembers = []
    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      if (isBase64Image(m.photo)) {
        if (DRY_RUN) {
          console.log(`[dry-run] would migrate keyPartners/${docSnap.id}.members[${i}].photo`)
          stats.migrated++
          newMembers.push(m)
        } else {
          try {
            const url = await uploadBase64ToCloudinary(m.photo, 'members')
            newMembers.push({ ...m, photo: url })
            changed = true
            stats.migrated++
            console.log(`OK   keyPartners/${docSnap.id}.members[${i}].photo`)
          } catch (err) {
            stats.failed++
            console.error(`FAIL keyPartners/${docSnap.id}.members[${i}].photo:`, (err as Error).message)
            newMembers.push(m)
          }
        }
      } else {
        stats.skipped++
        newMembers.push(m)
      }
    }
    if (changed && !DRY_RUN) await docSnap.ref.update({ members: newMembers })
  }
}

async function migratePortfolio() {
  const db = adminDb()
  const snap = await db.collection('portfolio').get()
  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const updates: Record<string, unknown> = {}

    if (isBase64Image(data.image)) {
      if (DRY_RUN) {
        console.log(`[dry-run] would migrate portfolio/${docSnap.id}.image`)
        stats.migrated++
      } else {
        try {
          updates.image = await uploadBase64ToCloudinary(data.image, 'portfolio')
          stats.migrated++
          console.log(`OK   portfolio/${docSnap.id}.image`)
        } catch (err) {
          stats.failed++
          console.error(`FAIL portfolio/${docSnap.id}.image:`, (err as Error).message)
        }
      }
    } else {
      stats.skipped++
    }

    const gallery = Array.isArray(data.gallery) ? data.gallery : []
    let galleryChanged = false
    const newGallery = []
    for (let i = 0; i < gallery.length; i++) {
      const g = gallery[i]
      if (g.type === 'image' && isBase64Image(g.url)) {
        if (DRY_RUN) {
          console.log(`[dry-run] would migrate portfolio/${docSnap.id}.gallery[${i}].url`)
          stats.migrated++
          newGallery.push(g)
        } else {
          try {
            const url = await uploadBase64ToCloudinary(g.url, 'portfolio-gallery')
            newGallery.push({ ...g, url })
            galleryChanged = true
            stats.migrated++
            console.log(`OK   portfolio/${docSnap.id}.gallery[${i}].url`)
          } catch (err) {
            stats.failed++
            console.error(`FAIL portfolio/${docSnap.id}.gallery[${i}].url:`, (err as Error).message)
            newGallery.push(g)
          }
        }
      } else {
        stats.skipped++
        newGallery.push(g)
      }
    }
    if (galleryChanged) updates.gallery = newGallery

    if (!DRY_RUN && Object.keys(updates).length) await docSnap.ref.update(updates)
  }
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (tidak ada perubahan ditulis) ===' : '=== Migrasi base64 -> Cloudinary ===')

  await migrateCollectionField('clients', 'src', 'clients')
  await migrateCollectionField('leaders', 'image', 'leadership')
  await migrateCollectionField('news', 'coverImage', 'news')
  await migrateCollectionField('services', 'image', 'services')
  await migrateCollectionField('users', 'avatarUrl', 'avatars')

  await migrateSiteContentField('hero', 'image', 'homepage/hero')
  await migrateSiteContentField('aboutHome', 'teamImage', 'homepage/about')
  await migrateSiteContentField('advantageSection', 'image', 'advantages/section')
  await migrateSiteContentField('company', 'logoUrl', 'company')
  await migrateSiteContentField('company', 'faviconUrl', 'company')

  await migrateGallery()
  await migrateKeyPartners()
  await migratePortfolio()

  console.log('===============================')
  console.log(`Migrated: ${stats.migrated}  Skipped (bukan base64): ${stats.skipped}  Failed: ${stats.failed}`)
  if (stats.failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error('Migrasi gagal total:', err)
  process.exit(1)
})
