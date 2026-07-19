import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return false

  try {
    const decoded = await adminAuth().verifyIdToken(token)
    if (!decoded?.email) return false

    const callerDoc = await adminDb().collection('users').doc(decoded.email).get()
    return callerDoc.data()?.role === 'admin'
  } catch (err) {
    console.error('requireAdmin failed (check Firebase Admin env vars):', err)
    return false
  }
}

// Stopgap for when Vercel's ISR-write quota is exhausted and on-demand
// revalidation stops taking effect: forces a full rebuild via a Deploy Hook,
// which regenerates every page fresh regardless of ISR cache state.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) {
    console.error('force-deploy: VERCEL_DEPLOY_HOOK_URL is not configured')
    return NextResponse.json({ error: 'Deploy hook belum dikonfigurasi' }, { status: 500 })
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' })
    if (!res.ok) {
      console.error('force-deploy: hook request failed', res.status, await res.text().catch(() => ''))
      return NextResponse.json({ error: 'Gagal memicu deploy' }, { status: 502 })
    }
    return NextResponse.json({ triggered: true })
  } catch (err) {
    console.error('force-deploy: hook request threw', err)
    return NextResponse.json({ error: 'Gagal memicu deploy' }, { status: 502 })
  }
}
