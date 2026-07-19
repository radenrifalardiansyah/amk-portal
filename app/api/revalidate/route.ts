import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return false

  try {
    const decoded = await adminAuth().verifyIdToken(token)
    if (!decoded?.email) return false

    const callerDoc = await adminDb().collection('users').doc(decoded.email).get()
    return callerDoc.exists
  } catch (err) {
    console.error('requireAdmin failed (check Firebase Admin env vars):', err)
    return false
  }
}

interface RevalidateEntry {
  path: string
  type?: 'page' | 'layout'
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rawPaths = Array.isArray(body?.paths) ? body.paths : []
  const entries: RevalidateEntry[] = rawPaths
    .map((p: unknown) => (typeof p === 'string' ? { path: p } : p))
    .filter((e: unknown): e is RevalidateEntry => !!e && typeof (e as RevalidateEntry).path === 'string')

  if (!entries.length) {
    return NextResponse.json({ error: 'paths wajib diisi' }, { status: 400 })
  }

  for (const entry of entries) {
    revalidatePath(entry.path, entry.type)
  }

  return NextResponse.json({ revalidated: true, entries })
}
