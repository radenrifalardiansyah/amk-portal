import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, adminMessaging } from '@/lib/firebaseAdmin'

async function requireUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const decoded = await adminAuth().verifyIdToken(token).catch(() => null)
  return decoded?.email ?? null
}

// Fire-and-forget target for chatService.sendMessage: pushes an FCM notification
// to every other participant's registered devices. Recipients & sender name are
// resolved server-side from Firestore rather than trusting the client body.
export async function POST(req: NextRequest) {
  const senderEmail = await requireUser(req)
  if (!senderEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : ''
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!conversationId || !text) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const convoSnap = await adminDb().collection('chatConversations').doc(conversationId).get()
  const convo = convoSnap.data()
  if (!convo) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const recipientEmails: string[] = convo.type === 'team'
    ? (await adminDb().collection('users').get()).docs.map((d) => d.id).filter((e) => e !== senderEmail)
    : ((convo.participants as string[] | undefined) ?? []).filter((e) => e !== senderEmail)

  if (!recipientEmails.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const tokenDocs = await Promise.all(recipientEmails.map((e) => adminDb().collection('fcm_tokens').doc(e).get()))
  const tokens = tokenDocs.flatMap((d) => (d.data()?.tokens as string[] | undefined) ?? [])
  if (!tokens.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const senderDoc = await adminDb().collection('users').doc(senderEmail).get()
  const senderName = (senderDoc.data()?.name as string | undefined) || senderEmail
  const title = convo.type === 'team' ? `${senderName} · Team Chat` : senderName
  const truncatedBody = text.length > 120 ? `${text.slice(0, 117)}...` : text

  const result = await adminMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body: truncatedBody },
    webpush: {
      notification: { icon: '/icons/icon-192.png' },
      fcmOptions: { link: '/admin/dashboard' },
    },
  })

  const invalidTokens = tokens.filter((_, i) => {
    const code = result.responses[i].error?.code
    return !result.responses[i].success
      && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')
  })

  if (invalidTokens.length) {
    await Promise.all(recipientEmails.map(async (email) => {
      const ref = adminDb().collection('fcm_tokens').doc(email)
      const snap = await ref.get()
      const existing = (snap.data()?.tokens as string[] | undefined) ?? []
      const cleaned = existing.filter((t) => !invalidTokens.includes(t))
      if (cleaned.length !== existing.length) await ref.set({ tokens: cleaned }, { merge: true })
    }))
  }

  return NextResponse.json({ ok: true, sent: result.successCount })
}
