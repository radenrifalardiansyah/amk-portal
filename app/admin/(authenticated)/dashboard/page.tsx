'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { Timestamp } from 'firebase/firestore'
import StatCard from '@/components/admin/StatCard'
import AreaTrendChart from '@/components/admin/charts/AreaTrendChart'
import DonutChart from '@/components/admin/charts/DonutChart'
import BarList from '@/components/admin/charts/BarList'
import { portfolioService, servicesService, advantagesService, leadersService, clientsService, analyticsService, newsService } from '@/lib/services'
import type { PageView } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

function tsToDate(ts: Timestamp | null): Date | null {
  if (!ts) return null
  if (typeof (ts as Timestamp).toDate === 'function') return (ts as Timestamp).toDate()
  const raw = ts as unknown as { seconds?: number }
  if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000)
  return null
}

function countOnDay(items: { createdAt: Timestamp | null }[], daysAgo: number) {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
  return items.filter((item) => {
    const d = tsToDate(item.createdAt)
    if (!d) return false
    return d.getDate() === target.getDate() && d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear()
  }).length
}

// Renders a real delta ("+12% dibanding kemarin") instead of a static label, so the
// StatCard change indicator actually reflects the underlying trend.
function pctChange(curr: number, prev: number, vsLabel: string): { text: string; type: 'up' | 'down' | 'neutral' } {
  if (prev === 0 && curr === 0) return { text: `Belum ada data dibanding ${vsLabel}`, type: 'neutral' }
  if (prev === 0) return { text: `+${curr} dibanding ${vsLabel}`, type: 'up' }
  const pct = Math.round(((curr - prev) / prev) * 100)
  if (pct === 0) return { text: `Sama seperti ${vsLabel}`, type: 'neutral' }
  return { text: `${pct > 0 ? '+' : ''}${pct}% dibanding ${vsLabel}`, type: pct > 0 ? 'up' : 'down' }
}

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
const fullDateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

function buildDailyTrend(dates: (Date | null)[], days: number) {
  const now = new Date()
  const buckets: { key: string; label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    buckets.push({ key: d.toDateString(), label: dayLabelFormatter.format(d), value: 0 })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  dates.forEach((d) => {
    if (!d) return
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()
    const bucket = byKey.get(key)
    if (bucket) bucket.value += 1
  })
  return buckets.map(({ label, value }) => ({ label, value }))
}

function buildDeviceBreakdown(views: PageView[]) {
  const desktop = views.filter((v) => v.device === 'desktop').length
  const mobile = views.filter((v) => v.device === 'mobile').length
  return [
    { label: 'Desktop', value: desktop, color: theme.chartPalette[0] },
    { label: 'Mobile', value: mobile, color: theme.chartPalette[4] },
  ]
}

function menuLabelForPath(path: string): string {
  if (path === '/' || path === '') return 'Home'
  if (path.startsWith('/about')) return 'About'
  if (path.startsWith('/services')) return 'Services'
  if (path.startsWith('/portfolio')) return 'Portfolio'
  if (path.startsWith('/gallery')) return 'Gallery'
  if (path.startsWith('/news')) return 'News'
  return 'Lainnya'
}

function buildMenuBreakdown(views: PageView[]) {
  const counts = new Map<string, number>()
  views.forEach((v) => {
    const label = menuLabelForPath(v.path)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: theme.chartPalette[i % theme.chartPalette.length] }))
}

// Detail-page views (`/portfolio/[slug]`, `/news/[slug]`) rolled up per slug so we can
// surface which specific projects/articles actually drive traffic, not just the menu total.
function buildTopContentBreakdown(views: PageView[], prefix: string, titleBySlug: Map<string, string>, topN = 5) {
  const counts = new Map<string, number>()
  views.forEach((v) => {
    if (!v.path.startsWith(prefix)) return
    const slug = v.path.slice(prefix.length).split('/').filter(Boolean)[0]
    if (!slug) return
    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([slug, value], i) => ({ label: titleBySlug.get(slug) ?? slug, value, color: theme.chartPalette[i % theme.chartPalette.length] }))
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']

function buildPeakInsight(views: PageView[]) {
  const hourCounts = new Array(24).fill(0)
  const dayCounts = new Array(7).fill(0)
  let sample = 0
  views.forEach((v) => {
    const d = tsToDate(v.createdAt)
    if (!d) return
    hourCounts[d.getHours()] += 1
    dayCounts[d.getDay()] += 1
    sample += 1
  })
  if (sample === 0) return { peakHourLabel: '—', peakDayLabel: '—' }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts))
  return {
    peakHourLabel: `${String(peakHour).padStart(2, '0')}:00–${String((peakHour + 1) % 24).padStart(2, '0')}:00`,
    peakDayLabel: DAY_NAMES[peakDay],
  }
}

export default function DashboardPage() {
  const { data: pageViews = [] } = useSWR('analytics-recent-14', () => analyticsService.getRecent(14))
  const { data: firstRecordedAt } = useSWR('analytics-first-recorded', () => analyticsService.getFirstRecordedAt())

  const { data: counts } = useSWR('admin-dashboard-counts', async () => {
    const [v, p, s, a, l, c, n] = await Promise.all([
      analyticsService.getCount(),
      portfolioService.getCount(),
      servicesService.getCount(),
      advantagesService.getCount(),
      leadersService.getCount(),
      clientsService.getCount(),
      newsService.getCount(),
    ])
    return { v, p, s, a, l, c, n }
  })

  const { data: contentLists } = useSWR('admin-dashboard-content-lists', async () => {
    const [portfolioList, newsList] = await Promise.all([portfolioService.getAllPublished(), newsService.getAllPublished()])
    return { portfolioList, newsList }
  })

  const totalViews = counts?.v ?? 0
  const portfolioCount = counts?.p ?? 0
  const servicesCount = counts?.s ?? 0
  const advantagesCount = counts?.a ?? 0
  const leadersCount = counts?.l ?? 0
  const clientsCount = counts?.c ?? 0
  const newsCount = counts?.n ?? 0

  const viewsTrend = useMemo(() => buildDailyTrend(pageViews.map((v) => tsToDate(v.createdAt)), 14), [pageViews])
  const deviceBreakdown = useMemo(() => buildDeviceBreakdown(pageViews), [pageViews])
  const menuBreakdown = useMemo(() => buildMenuBreakdown(pageViews), [pageViews])
  const peakInsight = useMemo(() => buildPeakInsight(pageViews), [pageViews])

  const portfolioTitleBySlug = useMemo(
    () => new Map((contentLists?.portfolioList ?? []).map((p) => [p.slug, p.title])),
    [contentLists],
  )
  const newsTitleBySlug = useMemo(
    () => new Map((contentLists?.newsList ?? []).map((n) => [n.slug, n.title])),
    [contentLists],
  )
  const topPortfolio = useMemo(() => buildTopContentBreakdown(pageViews, '/portfolio/', portfolioTitleBySlug), [pageViews, portfolioTitleBySlug])
  const topNews = useMemo(() => buildTopContentBreakdown(pageViews, '/news/', newsTitleBySlug), [pageViews, newsTitleBySlug])

  const contentDistribution = useMemo(() => [
    { label: 'Portfolio', value: portfolioCount, color: theme.chartPalette[0] },
    { label: 'Services', value: servicesCount, color: theme.chartPalette[1] },
    { label: 'Advantages', value: advantagesCount, color: theme.chartPalette[2] },
    { label: 'Leaders', value: leadersCount, color: theme.chartPalette[3] },
    { label: 'Clients', value: clientsCount, color: theme.chartPalette[4] },
    { label: 'News', value: newsCount, color: theme.chartPalette[5] },
  ], [portfolioCount, servicesCount, advantagesCount, leadersCount, clientsCount, newsCount])

  const todayViews = countOnDay(pageViews, 0)
  const yesterdayViews = countOnDay(pageViews, 1)
  const todayChange = pctChange(todayViews, yesterdayViews, 'kemarin')

  const firstRecordedDate = useMemo(() => tsToDate(firstRecordedAt ?? null), [firstRecordedAt])
  const totalViewsHint = firstRecordedDate
    ? `Akumulasi seluruh page view sejak ${fullDateFormatter.format(firstRecordedDate)} (bukan visitor unik)`
    : 'Akumulasi seluruh page view yang tercatat sejak situs live (bukan visitor unik)'

  const last7DaysViews = viewsTrend.slice(-7).reduce((sum, d) => sum + d.value, 0)
  const prev7DaysViews = viewsTrend.slice(0, 7).reduce((sum, d) => sum + d.value, 0)
  const weekChange = pctChange(last7DaysViews, prev7DaysViews, '7 hari sebelumnya')

  return (
    <>
      {/* Stat Cards — visits */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <StatCard
          title="Total Kunjungan" value={totalViews} icon="visibility" delay="0s"
          hint={totalViewsHint}
        />
        <StatCard
          title="Kunjungan Hari Ini" value={todayViews} icon="today" delay="0.05s"
          hint="Page view yang tercatat hari ini, dihitung ulang mulai 00:00"
          change={todayChange.text} changeType={todayChange.type}
        />
      </div>

      {/* Kunjungan per Menu & Distribusi Konten */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div
          className="lg:col-span-2 rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.15s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Kunjungan per Menu</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>
            Halaman portal yang paling sering dibuka pengunjung dalam 14 hari terakhir, dihitung dari page view per URL.
          </p>
          <BarList items={menuBreakdown} />
        </div>

        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.2s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Distribusi Konten</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>
            Perbandingan jumlah item yang sudah dipublikasikan di tiap kategori konten portal.
          </p>
          <DonutChart segments={contentDistribution} />
        </div>
      </div>

      {/* Charts — visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div
          className="lg:col-span-2 rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.3s' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 0' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Tren Kunjungan</h2>
              <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, maxWidth: 340 }}>
                Jumlah page view per hari selama 14 hari terakhir, dicatat otomatis setiap kali pengunjung membuka sebuah halaman.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, lineHeight: 1 }}>{last7DaysViews}</p>
              <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 2 }}>7 hari terakhir</p>
              <p style={{
                fontSize: 10.5, marginTop: 4, fontWeight: 600,
                color: weekChange.type === 'up' ? '#16803D' : weekChange.type === 'down' ? theme.danger : theme.textSecondary,
              }}>
                {weekChange.text}
              </p>
            </div>
          </div>
          <div style={{ padding: '4px 20px 16px' }}>
            <AreaTrendChart data={viewsTrend} color={theme.chartPalette[4]} />
          </div>
        </div>

        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.35s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Desktop vs Mobile</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>
            Jenis perangkat pengunjung, dideteksi otomatis dari user-agent browser saat halaman dibuka.
          </p>
          <DonutChart segments={deviceBreakdown} />
        </div>
      </div>

      {/* Konten Terpopuler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.4s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Portfolio Terpopuler</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>
            5 proyek portfolio dengan kunjungan halaman detail terbanyak (14 hari terakhir).
          </p>
          <BarList items={topPortfolio} />
        </div>

        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.45s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Berita Terpopuler</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>
            5 artikel berita dengan kunjungan halaman detail terbanyak (14 hari terakhir).
          </p>
          <BarList items={topNews} />
        </div>
      </div>

      {/* Insight Kunjungan */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          title="Jam Tersibuk" value={peakInsight.peakHourLabel} icon="schedule" delay="0.5s"
          hint="Jam dengan jumlah page view terbanyak dalam 14 hari terakhir — waktu yang baik untuk posting/promosi"
        />
        <StatCard
          title="Hari Tersibuk" value={peakInsight.peakDayLabel} icon="calendar_today" delay="0.55s"
          hint="Hari dengan jumlah page view terbanyak dalam 14 hari terakhir"
        />
      </div>

      <div
        className="rounded-2xl admin-fade-up mb-5"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.6s', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Ringkasan</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Rekap singkat dari data di atas.</p>
        </div>
        {[
          { label: 'Rata-rata kunjungan/hari (14 hari terakhir)', value: (viewsTrend.reduce((s, d) => s + d.value, 0) / viewsTrend.length).toFixed(1) },
          { label: 'Total konten terpublikasi (semua kategori)', value: portfolioCount + servicesCount + advantagesCount + leadersCount + clientsCount + newsCount },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: i < arr.length - 1 ? `1px solid ${theme.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: theme.textSecondary }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>{row.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}
