import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { newsService, type NewsArticle } from '@/lib/services'
import { jakartaNowInstant, publishInstant } from '@/lib/services/newsService'
import { adminDb } from '@/lib/firebaseAdmin'

async function logRun(entry: {
  status: 'success' | 'error'
  durationMs: number
  dueSlugs: string[]
  revalidatedPaths: string[]
  error?: string
}) {
  await adminDb().collection('cron_logs').add({
    job: 'revalidate-scheduled',
    ranAt: new Date().toISOString(),
    trigger: 'github-actions',
    ...entry,
  }).catch(() => {})
}

function requireCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

// Articles due in the last few days, in case a cron run gets skipped. Uses the
// same WIB wall-clock instant as newsService.isVisible so an article becomes
// live at exactly its scheduled publishedAt/publishedTime, not a UTC day later.
function isDue(article: NewsArticle, nowInstant: string): boolean {
  if (article.status !== 'published') return false
  if (publishInstant(article) > nowInstant) return false
  const cutoff = new Date(`${nowInstant.slice(0, 10)}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - 3)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return article.publishedAt >= cutoffStr
}

// Runs daily via GitHub Actions (see .github/workflows/cron-revalidate-scheduled.yml):
// brings statically-cached pages (revalidate = false) back in sync with articles
// whose scheduled publishedAt/publishedTime has now arrived. Each run is logged to
// the `cron_logs` collection so /admin/cron-logs can show execution history.
export async function GET(req: NextRequest) {
  if (!requireCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const nowInstant = jakartaNowInstant()
    const all = await newsService.getAll()
    const due = all.filter((n) => isDue(n, nowInstant))
    const dueSlugs = due.map((n) => n.slug)

    const revalidatedPaths = ['/', '/news', ...dueSlugs.map((slug) => `/news/${slug}`)]
    revalidatedPaths.forEach((path) => revalidatePath(path))

    await logRun({ status: 'success', durationMs: Date.now() - startedAt, dueSlugs, revalidatedPaths })

    return NextResponse.json({ revalidated: true, due: dueSlugs })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await logRun({ status: 'error', durationMs: Date.now() - startedAt, dueSlugs: [], revalidatedPaths: [], error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
