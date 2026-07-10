import { auth } from '@/lib/firebase'

export interface RevalidateTarget {
  path: string
  type?: 'page' | 'layout'
}

// Fire-and-forget: tells the server to drop its ISR cache for these paths right
// away, so admin edits show up on the public site instantly instead of waiting
// out the `revalidate = 300` window. Safe to ignore failures — the time-based
// revalidation still catches it eventually.
export async function revalidatePaths(targets: (string | RevalidateTarget)[]): Promise<void> {
  const token = await auth.currentUser?.getIdToken().catch(() => null)
  if (!token) return

  try {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paths: targets }),
    })
  } catch {
    // best-effort only
  }
}
