import {
  collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PortfolioProject, portfolioProjects as staticData } from '@/data/portfolio'

const COL = 'portfolio'

export const portfolioService = {
  async getAll(): Promise<PortfolioProject[]> {
    const snap = await getDocs(query(collection(db, COL), orderBy('year', 'desc')))
    if (snap.empty) return staticData
    return snap.docs.map((d) => d.data() as PortfolioProject)
  },

  async getBySlug(slug: string): Promise<PortfolioProject | null> {
    const snap = await getDoc(doc(db, COL, slug))
    if (!snap.exists()) return staticData.find((p) => p.slug === slug) ?? null
    return snap.data() as PortfolioProject
  },

  async getAllSlugs(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, COL))
      if (snap.empty) return staticData.map((p) => p.slug)
      return snap.docs.map((d) => d.id)
    } catch {
      return staticData.map((p) => p.slug)
    }
  },

  async save(project: PortfolioProject): Promise<void> {
    await setDoc(doc(db, COL, project.slug), { ...project })
  },

  async delete(slug: string): Promise<void> {
    await deleteDoc(doc(db, COL, slug))
  },

  async getCount(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, COL))
      return snap.size
    } catch { return 0 }
  },
}
