import {
  collection, getDocs, getDoc, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword, signOut, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword, onAuthStateChanged,
  type User as FirebaseAuthUser,
} from 'firebase/auth'
import { db, auth } from '@/lib/firebase'

export interface AdminUser {
  email: string
  name: string
  role: 'admin' | 'editor'
  phone?: string
  position?: string
  bio?: string
  avatarUrl?: string
}

export type SessionUser = AdminUser

export const SESSION_KEY = 'amk_admin_session'
export const SESSION_UPDATED_EVENT = 'amk-admin-session-updated'

const COL = 'users'

export const usersService = {
  async login(email: string, password: string): Promise<AdminUser> {
    await signInWithEmailAndPassword(auth, email, password)
    const profile = await usersService.getByEmail(email)
    if (!profile) {
      await signOut(auth)
      throw new Error('Profil admin tidak ditemukan di Firestore')
    }
    return profile
  },

  async logout(): Promise<void> {
    await signOut(auth)
  },

  onAuthChange(callback: (user: FirebaseAuthUser | null) => void) {
    return onAuthStateChanged(auth, callback)
  },

  async getAll(): Promise<AdminUser[]> {
    const snap = await getDocs(collection(db, COL))
    return snap.docs.map((d) => d.data() as AdminUser)
  },

  async getByEmail(email: string): Promise<AdminUser | null> {
    const snap = await getDoc(doc(db, COL, email))
    return snap.exists() ? (snap.data() as AdminUser) : null
  },

  async updateProfile(email: string, data: Partial<Omit<AdminUser, 'email' | 'role'>>): Promise<void> {
    await updateDoc(doc(db, COL, email), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = auth.currentUser
    if (!user || user.email !== email) return false
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword))
    } catch {
      return false
    }
    await updatePassword(user, newPassword)
    return true
  },

  async adminCreateUser(input: { email: string; password: string; name: string; role: 'admin' | 'editor' }): Promise<void> {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Tidak ada sesi aktif')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Gagal membuat pengguna')
    }
  },

  async adminDeleteUser(email: string): Promise<void> {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Tidak ada sesi aktif')
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Gagal menghapus pengguna')
    }
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
    window.dispatchEvent(new Event(SESSION_UPDATED_EVENT))
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}
