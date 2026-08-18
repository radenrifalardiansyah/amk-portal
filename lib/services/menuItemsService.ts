import {
  collection, getDocs, getCountFromServer, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AdminMenuItem {
  id: string
  moduleId: string
  parentId: string | null
  href: string
  icon: string
  label: string
  subtitle: string
  order: number
  /** Bypasses the role permission matrix entirely — visible to any authenticated user (Dashboard, Pengaturan Profil). */
  alwaysVisible: boolean
  /** Bypasses the role permission matrix but restricted to role === 'admin' (Struktur Menu, Hak Akses Role). */
  adminOnly: boolean
  showInBottomNav: boolean
  /** Whether this menu's corresponding public-facing nav link / homepage section renders on the portal. */
  showOnPortal: boolean
}

const COL = 'menu_items'

const seedData: AdminMenuItem[] = [
  { id: 'dashboard', moduleId: 'utama', parentId: null, href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', subtitle: 'Statistik & ringkasan aktivitas portal', order: 1, alwaysVisible: true, adminOnly: false, showInBottomNav: true, showOnPortal: true },
  { id: 'company', moduleId: 'utama', parentId: null, href: '/admin/company', icon: 'domain', label: 'Profil Perusahaan', subtitle: 'Kelola identitas perusahaan yang tampil di admin & website', order: 2, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },

  { id: 'homepage', moduleId: 'konten-website', parentId: null, href: '/admin/homepage', icon: 'home', label: 'Home', subtitle: 'Kelola konten Hero, Visi & Misi, dan Contact di halaman utama', order: 1, alwaysVisible: false, adminOnly: false, showInBottomNav: true, showOnPortal: true },
  { id: 'hero-slides', moduleId: 'konten-website', parentId: 'homepage', href: '/admin/hero-slides', icon: 'view_carousel', label: 'Hero Slider', subtitle: 'Kelola slide-slide gambar & teks pada Hero homepage', order: 1, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'about', moduleId: 'konten-website', parentId: null, href: '/admin/about', icon: 'info', label: 'About', subtitle: 'Kelola konten halaman /about (hero & about)', order: 2, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'services', moduleId: 'konten-website', parentId: null, href: '/admin/services', icon: 'design_services', label: 'Services', subtitle: 'Kelola layanan yang ditampilkan di portal', order: 3, alwaysVisible: false, adminOnly: false, showInBottomNav: true, showOnPortal: true },
  { id: 'badges', moduleId: 'konten-website', parentId: 'services', href: '/admin/core-business', icon: 'local_offer', label: 'Core Business', subtitle: 'Kelola master Core Business untuk kategori services', order: 4, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'advantages', moduleId: 'konten-website', parentId: null, href: '/admin/advantages', icon: 'military_tech', label: 'Advantages', subtitle: 'Kelola keunggulan yang ditampilkan di homepage', order: 4, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'portfolio', moduleId: 'konten-website', parentId: null, href: '/admin/portfolio', icon: 'photo_library', label: 'Portfolio', subtitle: 'Kelola proyek portfolio', order: 5, alwaysVisible: false, adminOnly: false, showInBottomNav: true, showOnPortal: true },
  { id: 'teams', moduleId: 'konten-website', parentId: null, href: '/admin/teams', icon: 'groups', label: 'Teams', subtitle: 'Kelola tim kepemimpinan & key partners yang ditampilkan di homepage', order: 6, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'clients', moduleId: 'konten-website', parentId: null, href: '/admin/clients', icon: 'handshake', label: 'Clients', subtitle: 'Kelola logo klien yang ditampilkan di homepage', order: 7, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'gallery', moduleId: 'konten-website', parentId: null, href: '/admin/gallery', icon: 'collections', label: 'Gallery', subtitle: 'Kelola foto yang ditampilkan di halaman Gallery', order: 8, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'news', moduleId: 'konten-website', parentId: null, href: '/admin/news', icon: 'newspaper', label: 'News', subtitle: 'Kelola berita & artikel yang ditampilkan di portal', order: 9, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },
  { id: 'news-kategori', moduleId: 'konten-website', parentId: 'news', href: '/admin/news-kategori', icon: 'sell', label: 'Kategori Berita', subtitle: 'Kelola master kategori untuk berita & artikel', order: 10, alwaysVisible: false, adminOnly: false, showInBottomNav: false, showOnPortal: true },

  { id: 'menu-struktur', moduleId: 'sistem', parentId: null, href: '/admin/menu-struktur', icon: 'account_tree', label: 'Struktur Menu', subtitle: 'Kelola modul & menu navigasi admin panel', order: 1, alwaysVisible: true, adminOnly: true, showInBottomNav: false, showOnPortal: true },
  { id: 'hak-akses', moduleId: 'sistem', parentId: null, href: '/admin/hak-akses', icon: 'lock', label: 'Hak Akses Role', subtitle: 'Atur permission matrix per role (admin/editor)', order: 2, alwaysVisible: true, adminOnly: true, showInBottomNav: false, showOnPortal: true },
  { id: 'pengguna', moduleId: 'sistem', parentId: null, href: '/admin/pengguna', icon: 'group', label: 'Pengguna', subtitle: 'Kelola akun admin & editor', order: 3, alwaysVisible: true, adminOnly: true, showInBottomNav: false, showOnPortal: true },
  { id: 'cron-logs', moduleId: 'sistem', parentId: null, href: '/admin/cron-logs', icon: 'history', label: 'Riwayat Cron', subtitle: 'Log eksekusi cron job terjadwal (GitHub Actions)', order: 4, alwaysVisible: true, adminOnly: true, showInBottomNav: false, showOnPortal: false },

  { id: 'settings', moduleId: 'akun', parentId: null, href: '/admin/settings', icon: 'manage_accounts', label: 'Pengaturan Profil', subtitle: 'Kelola informasi akun dan keamanan login Anda', order: 1, alwaysVisible: true, adminOnly: false, showInBottomNav: false, showOnPortal: true },
]

export const menuItemsService = {
  async getAll(): Promise<AdminMenuItem[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => d.data() as AdminMenuItem)
    } catch {
      return []
    }
  },

  async save(item: AdminMenuItem): Promise<void> {
    await setDoc(doc(db, COL, item.id), { ...item })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getCountFromServer(collection(db, COL))
      return snap.data().count
    } catch { return 0 }
  },

  async seedDefaults(): Promise<boolean> {
    const snap = await getDocs(collection(db, COL))
    if (!snap.empty) return false
    await Promise.all(seedData.map((m) => setDoc(doc(db, COL, m.id), { ...m })))
    return true
  },
}
