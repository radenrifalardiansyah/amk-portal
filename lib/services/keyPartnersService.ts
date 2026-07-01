import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface KeyPartnerMember {
  name: string
  role?: string
  instagram?: string
}

export interface KeyPartner {
  id: string
  icon: string
  category: string
  members: KeyPartnerMember[]
  order: number
}

const seedData: KeyPartner[] = [
  {
    id: 'visual-cinematic-directors', icon: 'movie', category: 'Visual & Cinematic Directors', order: 1,
    members: [
      { name: 'Miftah Putra' },
      { name: 'Agung Jarkasih' },
      { name: 'Febria Noviandi' },
    ],
  },
  {
    id: 'drone-pilot-technical-ops', icon: 'flight', category: 'Drone Pilot & Technical Operations', order: 2,
    members: [
      { name: 'Azi Nugroho' },
      { name: 'Hanapian' },
    ],
  },
  {
    id: 'videography-team', icon: 'videocam', category: 'Videography Team', order: 3,
    members: [
      { name: 'Rizky Imam' },
      { name: 'Yanuar Nurachaman' },
      { name: 'Fatisar Dogol' },
      { name: 'Deni Muchtar' },
    ],
  },
  {
    id: 'photography-team', icon: 'photo_camera', category: 'Photography Team', order: 4,
    members: [
      { name: 'Fandi' },
      { name: 'Agy Agustian' },
      { name: 'Luthfi upil' },
    ],
  },
  {
    id: 'it-visual-design-specialists', icon: 'design_services', category: 'IT & Visual Design Specialists', order: 5,
    members: [
      { name: 'Jundi', role: 'Web Designer & Developer' },
      { name: 'Revi Arvian', role: 'Visual Designer' },
      { name: 'Hilman', role: 'Cloth Specialist' },
    ],
  },
  {
    id: 'strategy-content-specialists', icon: 'lightbulb', category: 'Strategy & Content Specialists', order: 6,
    members: [
      { name: 'Arka Kharisma' },
      { name: 'Sahra' },
      { name: 'Kayla' },
      { name: 'Bima Chandra' },
    ],
  },
  {
    id: 'music-audio-production', icon: 'music_note', category: 'Music & Audio Production', order: 7,
    members: [
      { name: 'Dharma "Lyla"', role: 'Composer/Producer' },
      { name: 'Boim "Dadali"', role: 'Composer/Producer' },
      { name: 'Mada', role: 'Songwriter/Singer' },
      { name: 'Dua Suara Media', role: 'Music Publisher' },
    ],
  },
  {
    id: 'media-event-fnb-planners', icon: 'event', category: 'Media, Event & F&B Planners', order: 8,
    members: [
      { name: 'Cahyo' },
      { name: 'Egun' },
      { name: 'Sony' },
      { name: 'Rizaldi', role: 'Event Specialist' },
      { name: 'Revi Reviandi', role: 'F&B Specialist' },
      { name: 'BM Media', role: 'Key Videotron' },
    ],
  },
  {
    id: 'master-of-ceremony', icon: 'mic', category: 'Master of Ceremony (MC)', order: 9,
    members: [
      { name: 'Boviet Halim' },
      { name: 'Ramadhini Sari' },
      { name: 'Reza Ale' },
    ],
  },
  {
    id: 'studio-facilities-partners', icon: 'meeting_room', category: 'Studio Facilities Partners', order: 10,
    members: [
      { name: 'ACG Studio' },
      { name: 'Atedoz' },
      { name: 'Tanpa Batas Studio' },
      { name: 'RC House' },
    ],
  },
]

const COL = 'keyPartners'

export const keyPartnersService = {
  async getAll(): Promise<KeyPartner[]> {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KeyPartner))
    } catch {
      return []
    }
  },

  async save(item: KeyPartner): Promise<void> {
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
