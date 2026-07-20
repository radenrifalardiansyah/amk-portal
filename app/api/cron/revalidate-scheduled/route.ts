import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { newsService, type NewsArticle } from '@/lib/services'
import { jakartaNowInstant, publishInstant } from '@/lib/services/newsService'

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

// Runs daily via Vercel Cron: brings statically-cached pages (revalidate = false)
// back in sync with articles whose scheduled publishedAt/publishedTime has now arrived.
export async function GET(req: NextRequest) {
  if (!requireCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nowInstant = jakartaNowInstant()
  const all = await newsService.getAll()
  const due = all.filter((n) => isDue(n, nowInstant))

  revalidatePath('/')
  revalidatePath('/news')
  due.forEach((n) => revalidatePath(`/news/${n.slug}`))

  return NextResponse.json({ revalidated: true, due: due.map((n) => n.slug) })
}
