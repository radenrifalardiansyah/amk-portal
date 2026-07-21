'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import useSWR, { SWRConfig } from 'swr'
import { usersService, siteContentService, SESSION_UPDATED_EVENT, HEARTBEAT_INTERVAL_MS } from '@/lib/services'
import type { SessionUser, LoginRequest } from '@/lib/services'
import { theme } from '@/lib/admin-theme'
import { useAdminNav } from '@/lib/useAdminNav'
import type { NavItem } from '@/lib/useAdminNav'
import { PermissionContext, usePermissionValue } from '@/lib/permissions'
import ActiveAccountsWidget from '@/components/admin/ActiveAccountsWidget'
import VisitorChatsWidget from '@/components/admin/VisitorChatsWidget'

const APP_VERSION = '0.1.0'

export default function AdminAuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 30000 }}>
      <AdminAuthenticatedLayoutInner>{children}</AdminAuthenticatedLayoutInner>
    </SWRConfig>
  )
}

function AdminAuthenticatedLayoutInner({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null)
  const { data: company } = useSWR('company', siteContentService.getCompany)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [isDesktop, setIsDesktop] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [loginRequest, setLoginRequest] = useState<LoginRequest | null>(null)
  const [respondingToLoginRequest, setRespondingToLoginRequest] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const { navGroups, bottomNavItems, menuItems } = useAdminNav(!!session)
  const permission = usePermissionValue(session)

  const canView = (item: NavItem) => (item.adminOnly ? permission.isAdminRole : (item.alwaysVisible || permission.get(item.id).view))

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(canView)
        .map((item) => ({ ...item, children: item.children?.filter(canView) })),
    }))
    .filter((group) => group.items.length > 0)

  const visibleBottomNavItems = bottomNavItems.filter(canView)
  const bottomNavHrefs = new Set(bottomNavItems.map((item) => item.href))

  const pageMeta: Record<string, { title: string; subtitle: string }> = {}
  navGroups.forEach((group) => {
    group.items.forEach((item) => {
      pageMeta[item.href] = { title: item.label === 'About' ? 'Halaman About' : item.label, subtitle: item.subtitle }
      item.children?.forEach((child) => {
        pageMeta[child.href] = { title: child.label, subtitle: child.subtitle }
      })
    })
  })

  const currentMenuItem = menuItems.find((m) => m.href === pathname)
  const canViewCurrentPage = !currentMenuItem
    || (currentMenuItem.adminOnly ? permission.isAdminRole : (currentMenuItem.alwaysVisible || permission.get(currentMenuItem.id).view))

  useEffect(() => {
    const unsubscribe = usersService.onAuthChange(async (firebaseUser) => {
      if (!firebaseUser?.email) {
        usersService.clearSession()
        setSession(null)
        setLoading(false)
        router.replace('/admin/login')
        return
      }
      const profile = await usersService.getByEmail(firebaseUser.email)
      if (!profile) {
        usersService.clearSession()
        setSession(null)
        setLoading(false)
        router.replace('/admin/login')
        return
      }
      usersService.saveSession(profile)
      setSession(profile)
      setLoading(false)
    })
    return unsubscribe
  }, [router])

  // Settings page updates the session (e.g. new avatar) in localStorage after
  // saving; this keeps the sidebar/header avatar in sync without a full reload.
  useEffect(() => {
    const handler = () => {
      const s = usersService.getSession()
      if (s) setSession(s)
    }
    window.addEventListener(SESSION_UPDATED_EVENT, handler)
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, handler)
  }, [])

  // Enforces a single active session per account: refreshes this session's
  // "alive" heartbeat, and if another device/browser takes over the lock
  // (login page force-login), signs this browser out immediately.
  useEffect(() => {
    const email = session?.email
    if (!email) return
    const localSessionId = usersService.getLocalSessionId()
    if (!localSessionId) return

    let stillOwner = true
    const heartbeatId = setInterval(() => {
      if (stillOwner) usersService.sendHeartbeat(email)
    }, HEARTBEAT_INTERVAL_MS)

    const unsubscribe = usersService.watchActiveSession(email, (active) => {
      if (!stillOwner) return
      if (active && active.sessionId !== localSessionId) {
        stillOwner = false
        clearInterval(heartbeatId)
        usersService.markKickedElsewhere()
        usersService.clearSession()
        usersService.signOutLocally()
        router.replace('/admin/login')
      }
    })

    return () => {
      unsubscribe()
      clearInterval(heartbeatId)
    }
  }, [session?.email, router])

  // Listens for an admin-initiated kick (distinct from the takeover watcher above:
  // there's no new session claiming the lock here, so this browser also releases it).
  useEffect(() => {
    const email = session?.email
    if (!email) return
    let initial = true
    let lastSeen: string | null = null

    const unsubscribe = usersService.watchForceLogout(email, (forceLogoutAt) => {
      if (initial) {
        initial = false
        lastSeen = forceLogoutAt ?? null
        return
      }
      if (forceLogoutAt && forceLogoutAt !== lastSeen) {
        lastSeen = forceLogoutAt
        usersService.markKickedElsewhere()
        usersService.clearSession()
        usersService.logout().finally(() => router.replace('/admin/login'))
      }
    })

    return unsubscribe
  }, [session?.email, router])

  // Listens for a pending login request from another device trying to sign into
  // this same account, so this session can accept (approving logs this session
  // out via the watcher above once the new device takes the lock) or reject it.
  useEffect(() => {
    const email = session?.email
    if (!email) return

    const unsubscribe = usersService.watchLoginRequest(email, (request) => {
      setLoginRequest(request?.status === 'pending' ? request : null)
    })

    return unsubscribe
  }, [session?.email])

  const respondToLoginRequest = async (decision: 'approved' | 'rejected') => {
    const email = session?.email
    if (!email) return
    setRespondingToLoginRequest(true)
    try {
      await usersService.respondToLoginRequest(email, decision)
    } finally {
      setRespondingToLoginRequest(false)
      setLoginRequest(null)
    }
  }

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem('admin-sidebar-collapsed') === '1')
    try {
      const stored = localStorage.getItem('admin-nav-collapsed-groups')
      if (stored) setCollapsedGroups(JSON.parse(stored))
    } catch { /* ignore malformed storage */ }
  }, [])

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  const toggleGroupCollapsed = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      localStorage.setItem('admin-nav-collapsed-groups', JSON.stringify(next))
      return next
    })
  }

  const collapsed = sidebarCollapsed && isDesktop

  const handleLogout = () => setShowLogoutConfirm(true)

  const confirmLogout = async () => {
    setLoggingOut(true)
    await usersService.logout()
    usersService.clearSession()
    router.replace('/admin/login')
  }

  const brandName = company?.shortName || 'AMK'
  const meta = pageMeta[pathname] ?? { title: 'Dashboard', subtitle: undefined }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: theme.bg }}>
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt={brandName} style={{ width: 48, height: 48, objectFit: 'contain' }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: 14, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
            boxShadow: '0 8px 24px rgba(7,82,183,0.28)',
            fontFamily: theme.fontHeadline,
          }}>
            {brandName}
          </div>
        )}
        <p style={{ color: theme.textMuted, fontSize: 13 }}>Memverifikasi sesi...</p>
      </div>
    )
  }

  if (!session) return null

  const initials = (session.name || session.email || 'A')[0].toUpperCase()
  const displayName = session.name || session.email?.split('@')[0] || 'Admin'

  const visibleMenuItems = visibleNavGroups
    .flatMap((group) => group.items.flatMap((item) => (item.children?.length ? [item, ...item.children] : [item])))
    .filter((item) => !bottomNavHrefs.has(item.href))
  const isMoreSectionActive = visibleMenuItems.some((item) => item.href === pathname)

  return (
    <PermissionContext.Provider value={permission}>
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: theme.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(16,24,40,0.35)', backdropFilter: 'blur(4px)' }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 76 : 256,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: theme.surface,
          borderRight: `1px solid ${theme.border}`,
          zIndex: 45,
          height: '100vh',
          transition: 'transform 0.3s ease, width 0.2s ease',
        }}
        className="admin-sidebar sidebar-closed"
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 10px 12px' : '20px 20px 16px', borderBottom: `1px solid ${theme.divider}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={brandName} style={{ width: 36, height: 36, flexShrink: 0, objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
                boxShadow: '0 6px 16px rgba(7,82,183,0.25)',
                fontFamily: theme.fontHeadline,
              }}>
                {brandName}
              </div>
            )}
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p
                  title={brandName}
                  style={{ color: theme.text, fontSize: 14, fontWeight: 600, lineHeight: 1.2, fontFamily: theme.fontHeadline, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >{brandName}</p>
                <p style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 8px' }}>
          {visibleNavGroups.map((group) => {
            const isGroupOpen = collapsed || !collapsedGroups[group.label]
            return (
            <div key={group.label} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <button
                  onClick={() => toggleGroupCollapsed(group.label)}
                  aria-expanded={isGroupOpen}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '4px 10px 10px', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: theme.textMuted,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 3, height: 12, borderRadius: 2, flexShrink: 0, background: `linear-gradient(180deg, ${theme.accent}, ${theme.cyan})` }} />
                    {group.label}
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, transform: isGroupOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}
                  >expand_more</span>
                </button>
              )}
              {isGroupOpen && group.items.map((item) => {
                const isActive = pathname === item.href
                const hasChildren = !!item.children?.length
                const isChildActive = !!item.children?.some((c) => pathname === c.href)
                const isOpen = !collapsed && (openMenus[item.href] ?? (isActive || isChildActive))
                return (
                  <div key={item.href} style={{ marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        style={{
                          position: 'relative',
                          display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          padding: collapsed ? '9px 0' : '9px 10px', borderRadius: 10,
                          fontSize: 13.5, fontWeight: isActive ? 600 : 500, textDecoration: 'none',
                          background: isActive ? `linear-gradient(90deg, ${theme.accentDark}, ${theme.accent})` : 'transparent',
                          color: isActive ? '#fff' : theme.textSecondary,
                          boxShadow: isActive ? '0 4px 12px -4px rgba(7,82,183,0.5)' : 'none',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) { e.currentTarget.style.background = 'linear-gradient(90deg, rgba(7,82,183,0.07), rgba(7,82,183,0) 85%)'; e.currentTarget.style.color = theme.text }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textSecondary }
                        }}
                      >
                        {isActive && (
                          <span aria-hidden="true" style={{
                            position: 'absolute', left: collapsed ? '50%' : 14, top: '50%',
                            transform: collapsed ? 'translate(-50%, -50%)' : 'translateY(-50%)',
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(93,225,230,0.65), transparent 70%)',
                            filter: 'blur(5px)', pointerEvents: 'none', zIndex: 0,
                          }} />
                        )}
                        <span
                          className="material-symbols-outlined"
                          style={{
                            position: 'relative', zIndex: 1,
                            fontSize: 18, flexShrink: 0,
                            color: isActive ? theme.cyan : 'inherit',
                            fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
                          }}
                        >{item.icon}</span>
                        {!collapsed && (
                          <span style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                        )}
                      </Link>
                      {hasChildren && !collapsed && (
                        <button
                          onClick={() => setOpenMenus((prev) => ({ ...prev, [item.href]: !isOpen }))}
                          aria-label={isOpen ? `Tutup submenu ${item.label}` : `Buka submenu ${item.label}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, border: 'none', background: 'transparent', cursor: 'pointer',
                            color: theme.textMuted, borderRadius: 8, flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = theme.surfaceSoft }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                          >expand_more</span>
                        </button>
                      )}
                    </div>

                    {hasChildren && isOpen && (
                      <div style={{ marginTop: 2, paddingLeft: 18, borderLeft: `1px solid ${theme.divider}`, marginLeft: 20 }}>
                        {item.children!.map((child) => {
                          const isChildLinkActive = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 10, marginBottom: 2,
                                fontSize: 13, fontWeight: isChildLinkActive ? 600 : 500, textDecoration: 'none',
                                background: isChildLinkActive ? `linear-gradient(90deg, ${theme.accentDark}, ${theme.accent})` : 'transparent',
                                color: isChildLinkActive ? '#fff' : theme.textSecondary,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isChildLinkActive) { e.currentTarget.style.background = 'linear-gradient(90deg, rgba(7,82,183,0.07), rgba(7,82,183,0) 85%)'; e.currentTarget.style.color = theme.text }
                              }}
                              onMouseLeave={(e) => {
                                if (!isChildLinkActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textSecondary }
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: 16, flexShrink: 0,
                                  color: isChildLinkActive ? theme.cyan : 'inherit',
                                  fontVariationSettings: `'FILL' ${isChildLinkActive ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24`,
                                }}
                              >{child.icon}</span>
                              <span style={{ flex: 1 }}>{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: '10px', borderTop: `1px solid ${theme.divider}`, flexShrink: 0 }}>
          <div
            onClick={() => router.push('/admin/settings')}
            title="Lihat detail akun"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              flexDirection: collapsed ? 'column' : 'row',
              padding: collapsed ? '10px 6px' : '10px 12px', borderRadius: 12,
              background: theme.surfaceSoft,
              border: `1px solid ${theme.border}`,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.border }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.surfaceSoft }}
          >
            <div style={{
              position: 'relative', width: 28, height: 28, flexShrink: 0,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
              }}>
                {session.avatarUrl
                  ? <img src={session.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9 }} className="flex">
                <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#22C55E', opacity: 0.75 }} />
                <span style={{ position: 'relative', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#22C55E', border: `1.5px solid ${theme.surfaceSoft}` }} />
              </span>
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: theme.text, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ color: theme.textMuted, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.email}</p>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout() }}
              disabled={loggingOut}
              title="Keluar"
              style={{ color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 6, display: 'flex', borderRadius: 6, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.stopPropagation(); const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.danger; b.style.background = theme.dangerSoft }}
              onMouseLeave={(e) => { e.stopPropagation(); const b = e.currentTarget as HTMLButtonElement; b.style.color = theme.textMuted; b.style.background = 'none' }}
            >
              {loggingOut
                ? <span style={{ width: 14, height: 14, border: `2px solid ${theme.border}`, borderTopColor: theme.textSecondary, borderRadius: '50%', display: 'block' }} className="admin-spin" />
                : <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          position: 'relative',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
          padding: '0 24px', height: 60,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 20,
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.cyan}, ${theme.accent})`,
          }} />
          {isDesktop ? (
            <button
              onClick={toggleSidebarCollapsed}
              title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
              style={{
                padding: 8, borderRadius: 8, border: 'none',
                background: theme.surfaceSoft,
                cursor: 'pointer', color: theme.textSecondary, display: 'flex',
              }}
            >
              <span className="material-symbols-outlined">{collapsed ? 'menu_open' : 'menu'}</span>
            </button>
          ) : company?.logoUrl ? (
            <img src={company.logoUrl} alt={brandName} style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <span style={{ fontSize: 15, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline }}>{brandName}</span>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: theme.text, lineHeight: 1.2, fontFamily: theme.fontHeadline, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.title}
            </h1>
            {meta.subtitle && <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.subtitle}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/" target="_blank"
              className="hidden sm:flex"
              style={{
                alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8,
                fontSize: 12, fontWeight: 500, color: theme.textSecondary, textDecoration: 'none',
                transition: 'all 0.15s',
                border: `1px solid ${theme.border}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.surfaceSoft; e.currentTarget.style.color = theme.text }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.textSecondary }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>language</span>
              Website
            </Link>
            <Link href="/admin/settings" title="Pengaturan Profil" style={{
              width: 32, height: 32, borderRadius: '50%', padding: 2, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.cyan}, ${theme.accent})`,
              boxShadow: '0 4px 14px -4px rgba(7,82,183,0.5)',
            }}>
              <span style={{
                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: `linear-gradient(135deg, ${theme.accentDark}, ${theme.accent})`,
              }}>
                {session.avatarUrl
                  ? <img src={session.avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: isDesktop ? 0 : 72 }}>
          <div key={pathname} className="p-5 sm:p-6 admin-fade-up">
            {canViewCurrentPage ? children : (
              <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.dangerSoft }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 30, color: theme.danger }}>block</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: theme.textSecondary, fontSize: 15 }}>Akses Ditolak</p>
                  <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>Anda tidak memiliki hak akses untuk membuka halaman ini. Hubungi admin jika ini keliru.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation + "Semua" Sheet */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 40 }}>
        {sidebarOpen && (
          <div
            className="admin-sheet-pop"
            style={{
              maxHeight: '70vh', overflowY: 'auto',
              background: theme.surface,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: '14px 16px 20px',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto 16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px 8px' }}>
              {visibleMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? theme.accentSoft : theme.surfaceSoft,
                      color: isActive ? theme.accent : theme.textSecondary,
                    }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 24, fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
                      >{item.icon}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? theme.accentText : theme.textSecondary, textAlign: 'center', lineHeight: 1.2 }}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
              <button
                onClick={() => { setSidebarOpen(false); setShowAboutModal(true) }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: theme.surfaceSoft, color: theme.textSecondary,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>info</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: theme.textSecondary, textAlign: 'center', lineHeight: 1.2 }}>
                  Tentang
                </span>
              </button>
              <button
                onClick={() => { setSidebarOpen(false); handleLogout() }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: theme.dangerSoft, color: theme.danger,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>logout</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: theme.danger, textAlign: 'center', lineHeight: 1.2 }}>
                  Keluar
                </span>
              </button>
            </div>
          </div>
        )}

        <div
          role="navigation"
          aria-label="Menu utama"
          style={{
            background: theme.surface, borderTop: `1px solid ${theme.border}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'stretch' }}>
            {visibleBottomNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, padding: '9px 0', textDecoration: 'none',
                    color: isActive ? theme.accent : theme.textMuted,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 21, fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
                  >{item.icon}</span>
                  <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Tutup semua menu' : 'Buka semua menu'}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, padding: '9px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                color: (sidebarOpen || isMoreSectionActive) ? theme.accent : theme.textMuted,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 21, fontVariationSettings: `'FILL' ${(!sidebarOpen && isMoreSectionActive) ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
              >{sidebarOpen ? 'close' : 'apps'}</span>
              <span style={{ fontSize: 10.5, fontWeight: (sidebarOpen || isMoreSectionActive) ? 700 : 500 }}>Semua</span>
            </button>
          </div>
        </div>
      </div>

      <ActiveAccountsWidget session={session} canKick={permission.isAdminRole} />
      <VisitorChatsWidget />

      {/* Incoming Login Request Modal */}
      {loginRequest && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(16,24,40,0.45)', backdropFilter: 'blur(4px)', padding: 16,
          }}
          className="admin-modal-backdrop"
        >
          <div
            style={{
              width: '100%', maxWidth: 380, padding: 24, borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
              boxShadow: theme.shadowElevated,
            }}
            className="admin-modal-card"
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.accentSoft,
            }}>
              <span className="material-symbols-outlined" style={{ color: theme.accent, fontSize: 24 }}>
                {loginRequest.device === 'mobile' ? 'smartphone' : 'computer'}
              </span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, marginBottom: 6 }}>
              Permintaan Login Baru
            </h2>
            <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5, marginBottom: 22 }}>
              Ada percobaan login ke akun ini dari perangkat <strong>{loginRequest.device === 'mobile' ? 'Mobile' : 'Desktop'}</strong> lain
              (pukul {new Date(loginRequest.requestedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}).
              Terima akan langsung mengeluarkan Anda dari sesi ini.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                disabled={respondingToLoginRequest}
                onClick={() => respondToLoginRequest('rejected')}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: respondingToLoginRequest ? 'not-allowed' : 'pointer',
                  border: `1px solid ${theme.border}`, background: theme.surface,
                  color: theme.textSecondary, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                }}
              >
                Tolak
              </button>
              <button
                disabled={respondingToLoginRequest}
                onClick={() => respondToLoginRequest('approved')}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: respondingToLoginRequest ? 'not-allowed' : 'pointer', border: 'none',
                  background: theme.accent, color: '#fff', fontSize: 13, fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(7,82,183,0.28)', transition: 'all 0.15s',
                }}
              >
                Terima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(16,24,40,0.45)', backdropFilter: 'blur(4px)', padding: 16,
          }}
          className="admin-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 360, padding: 24, borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
              boxShadow: theme.shadowElevated,
            }}
            className="admin-modal-card"
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.dangerSoft,
            }}>
              <span className="material-symbols-outlined" style={{ color: theme.danger, fontSize: 24 }}>logout</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, marginBottom: 6 }}>
              Keluar dari Admin Panel?
            </h2>
            <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.5, marginBottom: 22 }}>
              Anda perlu login kembali untuk mengakses dashboard admin.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${theme.border}`, background: theme.surface,
                  color: theme.textSecondary, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.surfaceSoft; e.currentTarget.style.color = theme.text }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.surface; e.currentTarget.style.color = theme.textSecondary }}
              >
                Batal
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); confirmLogout() }}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer', border: 'none',
                  background: theme.danger, color: '#fff', fontSize: 13, fontWeight: 600,
                  boxShadow: '0 6px 16px rgba(220,38,38,0.28)', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#B91C1C' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = theme.danger }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About / Credit Modal (mobile only) */}
      {showAboutModal && (
        <div
          onClick={() => setShowAboutModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(16,24,40,0.45)', backdropFilter: 'blur(4px)', padding: 16,
          }}
          className="admin-modal-backdrop lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 360, padding: 24, borderRadius: 16,
              background: theme.surface, border: `1px solid ${theme.border}`,
              boxShadow: theme.shadowElevated, textAlign: 'center',
            }}
            className="admin-modal-card"
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: theme.accentSoft,
            }}>
              <span className="material-symbols-outlined" style={{ color: theme.accent, fontSize: 24 }}>info</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.text, fontFamily: theme.fontHeadline, marginBottom: 4 }}>
              {brandName} Admin Panel
            </h2>
            <p style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 18 }}>
              Versi {APP_VERSION}
            </p>
            <div style={{ borderTop: `1px solid ${theme.divider}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.5 }}>
                Dikembangkan oleh{' '}
                <a
                  href="https://eleven-digital.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: theme.accent, fontWeight: 600, textDecoration: 'none' }}
                >
                  PT. Eleven Digital Indonesia
                </a>
              </p>
              <p style={{ fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.5 }}>
                Didukung oleh <span style={{ fontWeight: 600, color: theme.textSecondary }}>PT. RMedia Solutions</span>
              </p>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              style={{
                marginTop: 20, width: '100%', padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${theme.border}`, background: theme.surface,
                color: theme.textSecondary, fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.surfaceSoft; e.currentTarget.style.color = theme.text }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.surface; e.currentTarget.style.color = theme.textSecondary }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <style>{`
        .admin-sidebar { position: fixed; top: 0; left: 0; }
        .sidebar-closed { transform: translateX(-100%); }
        .sidebar-open   { transform: translateX(0); }
        @media (min-width: 1024px) {
          .admin-sidebar { position: relative; }
          .sidebar-closed, .sidebar-open { transform: none; }
        }
        .admin-sheet-pop { animation: admin-sheet-up 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes admin-sheet-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .admin-modal-backdrop { animation: admin-modal-fade 0.15s ease; }
        .admin-modal-card { animation: admin-modal-pop 0.18s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes admin-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes admin-modal-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
    </PermissionContext.Provider>
  )
}
