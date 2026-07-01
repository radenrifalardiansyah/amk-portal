import {
  collection, addDoc, deleteDoc, doc, getDocs,
  onSnapshot, query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Lead {
  id: string
  name: string
  company?: string | null
  service: string
  message: string
  createdAt: Timestamp | null
}

export type CreateLeadInput = Pick<Lead, 'name' | 'company' | 'service' | 'message'>

const COL = 'leads'

export const leadsService = {
  async create(data: CreateLeadInput): Promise<void> {
    await addDoc(collection(db, COL), {
      name: data.name,
      company: data.company || null,
      service: data.service,
      message: data.message,
      createdAt: serverTimestamp(),
    })
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

  subscribe(
    callback: (leads: Lead[]) => void,
    onError?: () => void,
  ): () => void {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead))),
      onError,
    )
  },
}
