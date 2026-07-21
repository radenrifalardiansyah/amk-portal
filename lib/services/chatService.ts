import {
  collection, doc, addDoc, setDoc, onSnapshot,
  query, where, orderBy, limitToLast,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const TEAM_CHAT_ID = 'team'

export interface ChatMessage {
  id: string
  text: string
  senderEmail: string
  senderName: string
  createdAt: string
}

export interface ChatConversationMeta {
  id: string
  type: 'team' | 'dm'
  participants?: string[]
  lastMessageText?: string
  lastMessageAt?: string
  lastMessageSenderEmail?: string
  lastReadAt?: Record<string, string>
}

const COL = 'chatConversations'

// Deterministic id so both participants always land on the same conversation
// doc regardless of who opens the chat first.
export function getDmConversationId(emailA: string, emailB: string): string {
  const [a, b] = [emailA.toLowerCase(), emailB.toLowerCase()].sort()
  return `dm__${a}__${b}`
}

export const chatService = {
  watchTeamMeta(callback: (meta: ChatConversationMeta | null) => void) {
    return onSnapshot(
      doc(db, COL, TEAM_CHAT_ID),
      (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as ChatConversationMeta) : null),
      () => {},
    )
  },

  watchMyDmMetas(myEmail: string, callback: (metas: ChatConversationMeta[]) => void) {
    const q = query(collection(db, COL), where('type', '==', 'dm'), where('participants', 'array-contains', myEmail))
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatConversationMeta))),
      () => {},
    )
  },

  watchMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(collection(db, COL, conversationId, 'messages'), orderBy('createdAt', 'asc'), limitToLast(200))
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage))),
      () => {},
    )
  },

  async sendMessage(input: {
    conversationId: string
    type: 'team' | 'dm'
    participants?: string[]
    senderEmail: string
    senderName: string
    text: string
  }): Promise<void> {
    const text = input.text.trim()
    if (!text) return
    const now = new Date().toISOString()
    const convoRef = doc(db, COL, input.conversationId)

    await setDoc(convoRef, {
      type: input.type,
      ...(input.participants ? { participants: input.participants } : {}),
      lastMessageText: text,
      lastMessageAt: now,
      lastMessageSenderEmail: input.senderEmail,
      // Sending a message implies you've read up to this point yourself.
      [`lastReadAt.${input.senderEmail}`]: now,
    }, { merge: true })

    await addDoc(collection(convoRef, 'messages'), {
      text, senderEmail: input.senderEmail, senderName: input.senderName, createdAt: now,
    })
  },

  async markRead(conversationId: string, email: string): Promise<void> {
    await setDoc(doc(db, COL, conversationId), { [`lastReadAt.${email}`]: new Date().toISOString() }, { merge: true })
  },
}
