import { auth } from '@/lib/firebase'

export interface RevalidateTarget {
  path: string
  type?: 'page' | 'layout'
}

// Tells the server to drop its ISR cache for these paths right away, so admin
// edits show up on the public site instantly instead of waiting out the
// `revalidate = 300` window. Returns whether it actually succeeded — callers
// should surface a warning on `false` since the time-based revalidation is the
// only fallback left, and that can take up to 5 minutes.
export async function revalidatePaths(targets: (string | RevalidateTarget)[]): Promise<boolean> {
  const token = await auth.currentUser?.getIdToken().catch(() => null)
  if (!token) {
    console.error('revalidatePaths: no auth token available')
    return false
  }

  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paths: targets }),
    })
    if (!res.ok) {
      console.error('revalidatePaths: request failed', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('revalidatePaths: request threw', err)
    return false
  }
}
