import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const decoded = await adminAuth().verifyIdToken(token).catch(() => null)
  if (!decoded?.email) return null

  const callerDoc = await adminDb().collection('users').doc(decoded.email).get()
  const caller = callerDoc.data()
  if (!caller || caller.role !== 'admin') return null

  return { email: decoded.email }
}

export async function POST(req: NextRequest) {
  const caller = await requireAdmin(req)
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const role = body?.role === 'admin' ? 'admin' : 'editor'

  if (!email || !password || password.length < 6 || !name) {
    return NextResponse.json({ error: 'Data tidak lengkap atau password kurang dari 6 karakter' }, { status: 400 })
  }

  const existing = await adminDb().collection('users').doc(email).get()
  if (existing.exists) {
    return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
  }

  try {
    await adminAuth().createUser({ email, password, displayName: name })
  } catch (err) {
    const code = (err as { code?: string })?.code
    const message = code === 'auth/email-already-exists'
      ? 'Email sudah terdaftar di Firebase Authentication'
      : 'Gagal membuat akun'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  await adminDb().collection('users').doc(email).set({
    email, name, role, phone: '', position: '', bio: '', avatarUrl: '',
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin(req)
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
  }

  const existing = await adminDb().collection('users').doc(email).get()
  if (!existing.exists) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
  }

  const update: Record<string, unknown> = {}
  if (body?.role === 'admin' || body?.role === 'editor') update.role = body.role

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })
  }

  await adminDb().collection('users').doc(email).update(update)

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const caller = await requireAdmin(req)
  if (!caller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
  }
  if (email === caller.email) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun Anda sendiri' }, { status: 400 })
  }

  const userRecord = await adminAuth().getUserByEmail(email).catch(() => null)
  if (userRecord) {
    await adminAuth().deleteUser(userRecord.uid)
  }
  await adminDb().collection('users').doc(email).delete()

  return NextResponse.json({ ok: true })
}
