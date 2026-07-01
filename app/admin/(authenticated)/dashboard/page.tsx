'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import StatCard from '@/components/admin/StatCard'
import AreaTrendChart from '@/components/admin/charts/AreaTrendChart'
import DonutChart from '@/components/admin/charts/DonutChart'
import BarList from '@/components/admin/charts/BarList'
import { leadsService, portfolioService, servicesService, advantagesService, leadersService, clientsService, analyticsService, newsService } from '@/lib/services'
import type { Lead, PageView } from '@/lib/services'
import { theme } from '@/lib/admin-theme'

function tsToDate(ts: Timestamp | null): Date | null {
  if (!ts) return null
  if (typeof (ts as Timestamp).toDate === 'function') return (ts as Timestamp).toDate()
  const raw = ts as unknown as { seconds?: number }
  if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000)
  return null
}

function todayCount(items: { createdAt: Timestamp | null }[]) {
  const now = new Date()
  return items.filter((item) => {
    const d = tsToDate(item.createdAt)
    if (!d) return false
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }).length
}

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

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

function buildServiceBreakdown(leads: Lead[]) {
  const counts = new Map<string, number>()
  leads.forEach((l) => {
    const key = l.service.split('(')[0].trim() || 'Lainnya'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: theme.chartPalette[i % theme.chartPalette.length] }))
}

function buildDeviceBreakdown(views: PageView[]) {
  const desktop = views.filter((v) => v.device === 'desktop').length
  const mobile = views.filter((v) => v.device === 'mobile').length
  return [
    { label: 'Desktop', value: desktop, color: theme.chartPalette[0] },
    { label: 'Mobile', value: mobile, color: theme.chartPalette[4] },
  ]
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [portfolioCount, setPortfolioCount] = useState(0)
  const [servicesCount, setServicesCount] = useState(0)
  const [advantagesCount, setAdvantagesCount] = useState(0)
  const [leadersCount, setLeadersCount] = useState(0)
  const [clientsCount, setClientsCount] = useState(0)
  const [newsCount, setNewsCount] = useState(0)

  useEffect(() => {
    const unsub = leadsService.subscribe((data) => setLeads(data))
    return unsub
  }, [])

  useEffect(() => {
    analyticsService.getAll().then(setPageViews).catch(() => {})
  }, [])

  const fetchCounts = useCallback(async () => {
    try {
      const [p, s, a, l, c, n] = await Promise.all([
        portfolioService.getCount(),
        servicesService.getCount(),
        advantagesService.getCount(),
        leadersService.getCount(),
        clientsService.getCount(),
        newsService.getCount(),
      ])
      setPortfolioCount(p)
      setServicesCount(s)
      setAdvantagesCount(a)
      setLeadersCount(l)
      setClientsCount(c)
      setNewsCount(n)
    } catch (e) {
      console.error('fetchCounts error:', e)
    }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])

  const leadsTrend = useMemo(() => buildDailyTrend(leads.map((l) => tsToDate(l.createdAt)), 14), [leads])
  const viewsTrend = useMemo(() => buildDailyTrend(pageViews.map((v) => tsToDate(v.createdAt)), 14), [pageViews])
  const serviceBreakdown = useMemo(() => buildServiceBreakdown(leads), [leads])
  const deviceBreakdown = useMemo(() => buildDeviceBreakdown(pageViews), [pageViews])
  const contentDistribution = useMemo(() => [
    { label: 'Portfolio', value: portfolioCount, color: theme.chartPalette[0] },
    { label: 'Services', value: servicesCount, color: theme.chartPalette[1] },
    { label: 'Advantages', value: advantagesCount, color: theme.chartPalette[2] },
    { label: 'Leaders', value: leadersCount, color: theme.chartPalette[3] },
    { label: 'Clients', value: clientsCount, color: theme.chartPalette[4] },
    { label: 'News', value: newsCount, color: theme.chartPalette[5] },
  ], [portfolioCount, servicesCount, advantagesCount, leadersCount, clientsCount, newsCount])
  const last7DaysLeads = useMemo(
    () => leadsTrend.slice(-7).reduce((sum, d) => sum + d.value, 0),
    [leadsTrend],
  )
  const last7DaysViews = useMemo(
    () => viewsTrend.slice(-7).reduce((sum, d) => sum + d.value, 0),
    [viewsTrend],
  )

  return (
    <>
      {/* Stat Cards — visits */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <StatCard title="Total Kunjungan"   value={pageViews.length}      icon="visibility" delay="0s" />
        <StatCard title="Kunjungan Hari Ini" value={todayCount(pageViews)} icon="today"      delay="0.05s" change="Pengunjung baru" changeType="up" />
      </div>

      {/* Stat Cards — row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <StatCard title="Total Leads"  value={leads.length}       icon="mark_email_unread" delay="0.1s" />
        <StatCard title="Hari Ini"     value={todayCount(leads)}  icon="today"             delay="0.15s" change="Leads baru" changeType="up" />
        <StatCard title="Portfolio"    value={portfolioCount}     icon="photo_library"     delay="0.2s" />
        <StatCard title="Services"     value={servicesCount}      icon="design_services"   delay="0.25s" />
      </div>
      {/* Stat Cards — row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard title="Advantages"   value={advantagesCount}    icon="auto_awesome"      delay="0.2s" />
        <StatCard title="Leaders"      value={leadersCount}       icon="people"            delay="0.25s" />
        <StatCard title="Clients"      value={clientsCount}       icon="handshake"         delay="0.3s" />
        <StatCard title="News"         value={newsCount}          icon="newspaper"         delay="0.35s" />
      </div>

      {/* Charts — visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div
          className="lg:col-span-2 rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.3s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Tren Kunjungan</h2>
              <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>14 hari terakhir</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, lineHeight: 1 }}>{last7DaysViews}</p>
              <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 2 }}>7 hari terakhir</p>
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
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>Perangkat pengunjung</p>
          <DonutChart segments={deviceBreakdown} />
        </div>
      </div>

      {/* Charts — leads & content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div
          className="lg:col-span-2 rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.4s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Tren Leads</h2>
              <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>14 hari terakhir</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, lineHeight: 1 }}>{last7DaysLeads}</p>
              <p style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 2 }}>7 hari terakhir</p>
            </div>
          </div>
          <div style={{ padding: '4px 20px 16px' }}>
            <AreaTrendChart data={leadsTrend} />
          </div>
        </div>

        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.45s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Distribusi Konten</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 16 }}>Total item per kategori</p>
          <DonutChart segments={contentDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <div
          className="lg:col-span-2 rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.5s', padding: '16px 20px' }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Leads per Layanan</h2>
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, marginBottom: 18 }}>Layanan paling banyak diminati</p>
          <BarList items={serviceBreakdown} />
        </div>

        <div
          className="rounded-2xl admin-fade-up"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadowCard, animationDelay: '0.55s', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}
        >
          <h2 style={{ fontWeight: 700, color: theme.text, fontSize: 14, fontFamily: theme.fontHeadline }}>Ringkasan</h2>
          {[
            { label: 'Rata-rata kunjungan/hari', value: (viewsTrend.reduce((s, d) => s + d.value, 0) / viewsTrend.length).toFixed(1) },
            { label: 'Rata-rata leads/hari', value: (leadsTrend.reduce((s, d) => s + d.value, 0) / leadsTrend.length).toFixed(1) },
            { label: 'Total konten portal', value: portfolioCount + servicesCount + advantagesCount + leadersCount + clientsCount + newsCount },
            { label: 'Layanan terpopuler', value: serviceBreakdown[0]?.label ?? '—' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: i < arr.length - 1 ? `1px solid ${theme.divider}` : 'none' }}>
              <span style={{ fontSize: 12, color: theme.textSecondary }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
