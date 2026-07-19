import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { newsService, type NewsArticle } from '@/lib/services'

function requireCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

function todayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Articles due in the last few days, in case a cron run gets skipped.
function isDue(article: NewsArticle, today: string): boolean {
  if (article.status !== 'published') return false
  const cutoff = new Date(`${today}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - 3)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return article.publishedAt <= today && article.publishedAt >= cutoffStr
}

// Runs daily via Vercel Cron: brings statically-cached pages (revalidate = false)
// back in sync with articles whose scheduled publishedAt date has now arrived.
export async function GET(req: NextRequest) {
  if (!requireCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = todayStr()
  const all = await newsService.getAll()
  const due = all.filter((n) => isDue(n, today))

  revalidatePath('/')
  revalidatePath('/news')
  due.forEach((n) => revalidatePath(`/news/${n.slug}`))

  return NextResponse.json({ revalidated: true, due: due.map((n) => n.slug) })
}
