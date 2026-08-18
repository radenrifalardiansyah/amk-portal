// One-time setup: registers the "Hero Slider" admin menu item and grants
// admin/editor roles view+edit+delete access to it, mirroring the existing
// "homepage" menu item's permission level (since Hero Slider lives under Home).
// Run: npx tsx scripts/setup-hero-slides-menu.ts
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

const MENU_ITEM = {
  id: 'hero-slides',
  moduleId: 'konten-website',
  parentId: 'homepage',
  href: '/admin/hero-slides',
  icon: 'view_carousel',
  label: 'Hero Slider',
  subtitle: 'Kelola slide-slide gambar & teks pada Hero homepage',
  order: 1,
  alwaysVisible: false,
  adminOnly: false,
  showInBottomNav: false,
  showOnPortal: true,
}

async function main() {
  const db = adminDb()

  const existingMenu = await db.collection('menu_items').doc('hero-slides').get()
  if (existingMenu.exists) {
    console.log('menu_items/hero-slides sudah ada, dilewati (tidak ditimpa).')
  } else {
    await db.collection('menu_items').doc('hero-slides').set(MENU_ITEM)
    console.log('menu_items/hero-slides ditambahkan:', JSON.stringify(MENU_ITEM, null, 2))
  }

  for (const role of ['admin', 'editor'] as const) {
    const snap = await db.collection('role_permissions').doc(role).get()
    if (!snap.exists) {
      console.log(`\nrole_permissions/${role} tidak ada dokumennya, dilewati.`)
      continue
    }
    const data = snap.data() as { permissions?: Record<string, unknown> }
    if (data.permissions?.['hero-slides']) {
      console.log(`\nrole_permissions/${role}.permissions.hero-slides sudah ada, dilewati.`)
      continue
    }
    // Mirror this role's existing "homepage" permission level (closest related menu item).
    const homepagePerm = (data.permissions?.homepage as { view: boolean; edit: boolean; delete: boolean; approve: boolean } | undefined)
      ?? { view: true, edit: true, delete: true, approve: false }
    await db.collection('role_permissions').doc(role).update({ 'permissions.hero-slides': homepagePerm })
    console.log(`\nrole_permissions/${role}.permissions.hero-slides diset ke:`, JSON.stringify(homepagePerm))
  }

  console.log('\nSelesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
