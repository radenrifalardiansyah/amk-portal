import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AdminUser {
  email: string
  password: string
  name: string
  role: 'admin' | 'editor'
  phone?: string
  position?: string
  bio?: string
  avatarUrl?: string
}

export type SessionUser = Omit<AdminUser, 'password'>

export const SESSION_KEY = 'amk_admin_session'

const COL = 'users'

export const usersService = {
  async login(email: string, password: string): Promise<AdminUser | null> {
    const snap = await getDocs(query(collection(db, COL), where('email', '==', email)))
    if (snap.empty) return null
    const user = snap.docs[0].data() as AdminUser
    if (user.password !== password) return null
    return user
  },

  async create(data: AdminUser): Promise<void> {
    await setDoc(doc(db, COL, data.email), {
      ...data,
      createdAt: serverTimestamp(),
    })
  },

  async getAll(): Promise<AdminUser[]> {
    const snap = await getDocs(collection(db, COL))
    return snap.docs.map((d) => d.data() as AdminUser)
  },

  async getByEmail(email: string): Promise<AdminUser | null> {
    const snap = await getDoc(doc(db, COL, email))
    return snap.exists() ? (snap.data() as AdminUser) : null
  },

  async hasUsers(): Promise<boolean> {
    const snap = await getDocs(collection(db, COL))
    return !snap.empty
  },

  async updateProfile(email: string, data: Partial<Omit<AdminUser, 'email' | 'password' | 'role'>>): Promise<void> {
    await updateDoc(doc(db, COL, email), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await usersService.getByEmail(email)
    if (!user || user.password !== currentPassword) return false
    await updateDoc(doc(db, COL, email), {
      password: newPassword,
      updatedAt: serverTimestamp(),
    })
    return true
  },

  getSession(): SessionUser | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as SessionUser } catch { return null }
  },

  saveSession(user: AdminUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone ?? '',
      position: user.position ?? '',
      bio: user.bio ?? '',
      avatarUrl: user.avatarUrl ?? '',
    }))
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}
