import {
  collection, doc, addDoc, setDoc, onSnapshot,
  query, orderBy, limitToLast,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const COL = 'visitorChats'
const STORAGE_KEY = 'amk_visitor_chat_id'

export interface VisitorMessage {
  id: string
  text: string
  sender: 'visitor' | 'bot' | 'admin'
  createdAt: string
}

export interface VisitorConversationMeta {
  id: string
  status: 'open' | 'handled' | 'closed'
  needsAdmin: boolean
  lastMessageText?: string
  lastMessageAt?: string
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

  async sendBotReply(conversationId: string, text: string, needsAdmin: boolean): Promise<void> {
    const now = new Date().toISOString()
    await setDoc(doc(db, COL, conversationId), {
      needsAdmin,
      lastMessageText: text,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text, sender: 'bot', createdAt: now,
    })
  },

  async sendAdminMessage(conversationId: string, text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    await setDoc(doc(db, COL, conversationId), {
      status: 'handled',
      needsAdmin: false,
      lastMessageText: trimmed,
      lastMessageAt: now,
    }, { merge: true })
    await addDoc(collection(db, COL, conversationId, 'messages'), {
      text: trimmed, sender: 'admin', createdAt: now,
    })
  },

  async closeConversation(conversationId: string): Promise<void> {
    await setDoc(doc(db, COL, conversationId), { status: 'closed', needsAdmin: false }, { merge: true })
  },
}
