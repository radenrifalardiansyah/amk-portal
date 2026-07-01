import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Client {
  id: string
  name: string
  src: string
  order: number
  industry?: string
  website?: string
  address?: string
  description?: string
  picName?: string
  picRole?: string
  picEmail?: string
  picPhone?: string
}

const seedData: Client[] = [
  { id: 'nippon',    name: 'Nippon Express',        src: '/images/clients/nippon.png',    order: 1 },
  { id: 'jica',      name: 'JICA',                  src: '/images/clients/jica.png',      order: 2 },
  { id: 'kabbogor',  name: 'Kabupaten Bogor',        src: '/images/clients/kabbogor.png',  order: 3 },
  { id: 'balairung', name: 'Balairung Hotel',        src: '/images/clients/balairung.png', order: 4 },
  { id: 'dprdbogor', name: 'DPRD Kota Bogor',        src: '/images/clients/dprdbogor.png', order: 5 },
  { id: 'walikota',  name: 'Walikota Bogor 2024',    src: '/images/clients/walikota.png',  order: 6 },
  { id: 'pks',       name: 'PKS',                   src: '/images/clients/pks.png',       order: 7 },
  { id: 'jeef',      name: 'J.E.E.F',               src: '/images/clients/jeef.png',      order: 8 },
  { id: 'mandiri',   name: 'Bank Mandiri',           src: '/images/clients/mandiri.png',   order: 9 },
  { id: 'rizkia',    name: 'Rizkia Tour & Travel',   src: '/images/clients/rizkia.png',    order: 10 },
  { id: 'malasari',  name: 'Desa Wisata Malasari',   src: '/images/clients/malasari.png',  order: 11 },
  { id: 'gerindra',  name: 'Gerindra',               src: '/images/clients/gerindra.png',  order: 12 },
  { id: 'salam',     name: 'Sekolah Alam Bogor',     src: '/images/clients/salam.png',     order: 13 },
  { id: 'pakuan',    name: 'Universitas Pakuan',     src: '/images/clients/pakuan.png',    order: 14 },
]

const COL = 'clients'

export const clientsService = {
  async getAll(): Promise<Client[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client))
    } catch {
      return []
    }
  },

  async save(item: Client): Promise<void> {
    await setDoc(doc(db, COL, item.id), { ...item })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.size
    } catch { return 0 }
  },

  async seedDefaults(): Promise<boolean> {
    const snap = await getDocs(collection(db, COL))
    if (!snap.empty) return false
    await Promise.all(seedData.map((item) => setDoc(doc(db, COL, item.id), { ...item })))
    return true
  },
}
