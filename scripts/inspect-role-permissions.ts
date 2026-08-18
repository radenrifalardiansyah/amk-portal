// Read-only: prints the current role_permissions docs (admin/editor) so we know
// what access level existing content menu items (e.g. gallery, homepage) have,
// to mirror the same level when adding a new menu item's permission entry.
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

  const menuSnap = await db.collection('menu_items').get()
  console.log(`menu_items: ${menuSnap.size} dokumen`)
  console.log('Ada "hero-slides"?', menuSnap.docs.some((d) => d.id === 'hero-slides'))
  console.log('Contoh doc "homepage":', JSON.stringify(menuSnap.docs.find((d) => d.id === 'homepage')?.data(), null, 2))

  for (const role of ['admin', 'editor']) {
    const snap = await db.collection('role_permissions').doc(role).get()
    if (!snap.exists) {
      console.log(`\nrole_permissions/${role}: TIDAK ADA dokumen`)
      continue
    }
    const data = snap.data() as any
    console.log(`\nrole_permissions/${role}:`)
    console.log('  homepage:', JSON.stringify(data.permissions?.homepage))
    console.log('  gallery:', JSON.stringify(data.permissions?.gallery))
    console.log('  hero-slides (sudah ada?):', JSON.stringify(data.permissions?.['hero-slides']))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
