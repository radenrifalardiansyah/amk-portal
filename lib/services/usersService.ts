import {
  collection, getDocs, getDoc, doc, updateDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword, signOut, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword, onAuthStateChanged,
  type User as FirebaseAuthUser,
} from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import type { DeviceType } from './analyticsService'

export interface ActiveSession {
  sessionId: string
  device: DeviceType
  lastActiveAt: string
}

export interface LoginRequest {
  requestId: string
  device: DeviceType
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface AdminUser {
  email: string
  name: string
  role: 'admin' | 'editor'
  phone?: string
  position?: string
  bio?: string
  avatarUrl?: string
  lastLoginAt?: string
  lastLoginDevice?: DeviceType
  activeSession?: ActiveSession | null
  loginRequest?: LoginRequest | null
}

export type SessionUser = AdminUser

// Thrown by login() when another device/browser holds a still-fresh session lock;
// the login page catches this to show a "waiting for approval" state while the
// existing session decides whether to accept or reject the new login.
export class LoginApprovalPendingError extends Error {
  requestId: string
  requestingDevice: DeviceType
  existingDevice: DeviceType
  existingLastActiveAt: string
  constructor(requestId: string, requestingDevice: DeviceType, existingDevice: DeviceType, existingLastActiveAt: string) {
    super('Menunggu persetujuan dari sesi yang sedang aktif')
    this.name = 'LoginApprovalPendingError'
    this.requestId = requestId
    this.requestingDevice = requestingDevice
    this.existingDevice = existingDevice
    this.existingLastActiveAt = existingLastActiveAt
  }
}

export const SESSION_KEY = 'amk_admin_session'
export const SESSION_UPDATED_EVENT = 'amk-admin-session-updated'
export const HEARTBEAT_INTERVAL_MS = 60_000

const SESSION_ID_KEY = 'amk_admin_session_id'
const KICKED_ELSEWHERE_KEY = 'amk_admin_kicked_elsewhere'
const SESSION_STALE_MS = 15 * 60_000

const COL = 'users'
const MOBILE_UA = /android|iphone|ipad|ipod|mobile|iemobile|opera mini/i

function detectDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'desktop'
  return MOBILE_UA.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

function isSessionActive(session?: ActiveSession | null): session is ActiveSession {
  if (!session?.sessionId) return false
  return Date.now() - new Date(session.lastActiveAt).getTime() < SESSION_STALE_MS
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const usersService = {
  async login(email: string, password: string, options?: { force?: boolean }): Promise<AdminUser> {
    await signInWithEmailAndPassword(auth, email, password)
    const profile = await usersService.getByEmail(email)
    if (!profile) {
      await signOut(auth)
      throw new Error('Profil admin tidak ditemukan di Firestore')
    }
    if (!options?.force && isSessionActive(profile.activeSession)) {
      const { device: existingDevice, lastActiveAt: existingLastActiveAt } = profile.activeSession
      const requestId = generateSessionId()
      const requestingDevice = detectDevice()
      const loginRequest: LoginRequest = {
        requestId, device: requestingDevice, requestedAt: new Date().toISOString(), status: 'pending',
      }
      // Stay signed in: the existing session needs us authenticated to read/write this
      // doc, and if approved we finalize below without asking for the password again.
      await updateDoc(doc(db, COL, email), { loginRequest })
      throw new LoginApprovalPendingError(requestId, requestingDevice, existingDevice, existingLastActiveAt)
    }

    const device = detectDevice()
    const now = new Date().toISOString()
    const sessionId = generateSessionId()
    const activeSession: ActiveSession = { sessionId, device, lastActiveAt: now }

    await updateDoc(doc(db, COL, email), { lastLoginAt: now, lastLoginDevice: device, activeSession, loginRequest: null })
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_ID_KEY, sessionId)

    return { ...profile, lastLoginAt: now, lastLoginDevice: device, activeSession }
  },

  async logout(): Promise<void> {
    const email = auth.currentUser?.email
    if (email) {
      await updateDoc(doc(db, COL, email), { activeSession: null }).catch(() => {})
    }
    await signOut(auth)
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_ID_KEY)
  },

  // Signs out this browser only, without releasing the session lock in Firestore —
  // used when THIS browser is the one being kicked out by a takeover elsewhere.
  async signOutLocally(): Promise<void> {
    await signOut(auth)
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_ID_KEY)
  },

  getLocalSessionId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SESSION_ID_KEY)
  },

  watchActiveSession(email: string, callback: (session: ActiveSession | null | undefined) => void) {
    return onSnapshot(
      doc(db, COL, email),
      (snap) => callback((snap.data() as AdminUser | undefined)?.activeSession),
      () => { /* ignore transient errors, e.g. right after sign-out during navigation */ },
    )
  },

  async sendHeartbeat(email: string): Promise<void> {
    await updateDoc(doc(db, COL, email), { 'activeSession.lastActiveAt': new Date().toISOString() }).catch(() => {})
  },

  watchLoginRequest(email: string, callback: (request: LoginRequest | null | undefined) => void) {
    return onSnapshot(
      doc(db, COL, email),
      (snap) => callback((snap.data() as AdminUser | undefined)?.loginRequest),
      () => { /* ignore transient errors, e.g. right after sign-out during navigation */ },
    )
  },

  async respondToLoginRequest(email: string, decision: 'approved' | 'rejected'): Promise<void> {
    await updateDoc(doc(db, COL, email), { 'loginRequest.status': decision }).catch(() => {})
  },

  async clearLoginRequest(email: string): Promise<void> {
    await updateDoc(doc(db, COL, email), { loginRequest: null }).catch(() => {})
  },

  // Signs out a login attempt that was left waiting for approval (rejected, timed
  // out, or manually cancelled) — this browser was signed in while pending but never
  // completed login, so no activeSession lock was ever taken.
  async cancelPendingLogin(): Promise<void> {
    await signOut(auth).catch(() => {})
  },

  markKickedElsewhere(): void {
    if (typeof window !== 'undefined') localStorage.setItem(KICKED_ELSEWHERE_KEY, '1')
  },

  takeKickedElsewhereFlag(): boolean {
    if (typeof window === 'undefined') return false
    if (!localStorage.getItem(KICKED_ELSEWHERE_KEY)) return false
    localStorage.removeItem(KICKED_ELSEWHERE_KEY)
    return true
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

  async adminUpdateUser(email: string, input: { role?: 'admin' | 'editor'; password?: string }): Promise<void> {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Tidak ada sesi aktif')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, ...input }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Gagal memperbarui pengguna')
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
      lastLoginAt: user.lastLoginAt ?? '',
      lastLoginDevice: user.lastLoginDevice ?? '',
    }))
    window.dispatchEvent(new Event(SESSION_UPDATED_EVENT))
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}
