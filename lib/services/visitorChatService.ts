import {
  collection, doc, addDoc, setDoc, getDoc, onSnapshot,
  query, orderBy, limitToLast,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const COL = 'visitorChats'
const STORAGE_KEY = 'amk_visitor_chat_id'
const ADMIN_INTRO_TEXT = 'Halo, saya dengan Admin AMK 👋 Terima kasih sudah menghubungi kami, mohon maaf atas waktu tunggunya ya.'

export interface VisitorMessage {
  id: string
  text: string
  sender: 'visitor' | 'bot' | 'admin'
  createdAt: string
  /** Optional in-page anchor link (e.g. "/#portfolio") shown as a clickable link under the message. */
  link?: string
}

export interface VisitorConversationMeta {
  id: string
  status: 'open' | 'handled' | 'closed'
  needsAdmin: boolean
  lastMessageText?: string
  lastMessageAt?: string
  contactSubmitted?: boolean
  visitorEmail?: string
  visitorPhone?: string
  adminIntroSent?: boolean
}

// Stable per-browser id so a returning visitor resumes the same thread.
export function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}

export const visitorChatService = {
  watchConversation(conversationId: string, callback: (meta: VisitorConversationMeta | null) => void) {
    return onSnapshot(
      doc(db, COL, conversationId),
      (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as VisitorConversationMeta) : null),
      () => {},
    )
  },

  watchMessages(conversationId: string, callback: (messages: VisitorMessage[]) => void) {
    const q = query(collection(db, COL, conversationId, 'messages'), orderBy('createdAt', 'asc'), limitToLast(200))
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VisitorMessage))),
      () => {},
    )
  },

  // Admin-side: every visitor thread, most recently active first.
  watchAllConversations(callback: (conversations: VisitorConversationMeta[]) => void) {
    const q = query(collection(db, COL), orderBy('lastMessageAt', 'desc'), limitToLast(100))
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VisitorConversationMeta))),
      () => {},
    )
  },

  async sendVisitorMessage(conversationId: string, text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    await setDoc(doc(db, COL, conversationId), {
      status: 'open',
      needsAdmin: false,
      lastMessageText: trimmed,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text: trimmed, sender: 'visitor', createdAt: now,
    })
  },

  async sendBotReply(conversationId: string, text: string, needsAdmin: boolean, link?: string): Promise<void> {
    const now = new Date().toISOString()
    await setDoc(doc(db, COL, conversationId), {
      needsAdmin,
      lastMessageText: text,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text, sender: 'bot', createdAt: now, ...(link ? { link } : {}),
    })
  },

  async sendAdminMessage(conversationId: string, text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    const ref = doc(db, COL, conversationId)

    // First real reply from a human admin on this thread gets a fixed intro line
    // so the visitor knows a person (not the bot) is now answering.
    const snap = await getDoc(ref)
    const alreadyIntroduced = Boolean(snap.exists() && (snap.data() as VisitorConversationMeta).adminIntroSent)
    if (!alreadyIntroduced) {
      await addDoc(collection(db, COL, conversationId, 'messages'), {
        text: ADMIN_INTRO_TEXT, sender: 'admin', createdAt: now,
      })
    }

    await setDoc(ref, {
      status: 'handled',
      needsAdmin: false,
      adminIntroSent: true,
      lastMessageText: trimmed,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text: trimmed, sender: 'admin', createdAt: now,
    })
  },

  // Visitor leaves contact info so an admin can follow up outside the chat too.
  async submitContactInfo(conversationId: string, email: string, phone: string): Promise<void> {
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedEmail || !trimmedPhone) return
    const now = new Date().toISOString()
    const text = `Kontak saya:\nEmail: ${trimmedEmail}\nNo. HP: ${trimmedPhone}`
    await setDoc(doc(db, COL, conversationId), {
      status: 'open',
      needsAdmin: true,
      contactSubmitted: true,
      visitorEmail: trimmedEmail,
      visitorPhone: trimmedPhone,
      lastMessageText: text,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text, sender: 'visitor', createdAt: now,
    })
  },

  async closeConversation(conversationId: string): Promise<void> {
    await setDoc(doc(db, COL, conversationId), { status: 'closed', needsAdmin: false }, { merge: true })
  },
}
