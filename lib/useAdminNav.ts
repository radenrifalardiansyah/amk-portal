'use client'

import useSWR from 'swr'
import { modulesService, menuItemsService } from '@/lib/services'
import type { AdminMenuItem } from '@/lib/services'

export interface NavItem {
  id: string
  href: string
  icon: string
  label: string
  subtitle: string
  alwaysVisible: boolean
  adminOnly: boolean
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

function toNavItem(m: AdminMenuItem): NavItem {
  return {
    id: m.id, href: m.href, icon: m.icon, label: m.label, subtitle: m.subtitle,
    alwaysVisible: m.alwaysVisible, adminOnly: m.adminOnly,
  }
}

/** Assembles the admin sidebar structure from Firestore `modules`/`menu_items` (managed via /admin/menu-struktur). */
export function useAdminNav() {
  const { data: modules = [], isLoading: modulesLoading } = useSWR('admin-modules', modulesService.getAll)
  const { data: menuItems = [], isLoading: menuItemsLoading } = useSWR('admin-menu-items', menuItemsService.getAll)

  const byModule = new Map<string, AdminMenuItem[]>()
  menuItems.filter((m) => !m.parentId).forEach((m) => {
    const list = byModule.get(m.moduleId) ?? []
    list.push(m)
    byModule.set(m.moduleId, list)
  })

  const navGroups: NavGroup[] = modules
    .map((mod) => ({
      label: mod.label,
      items: (byModule.get(mod.id) ?? []).map((item) => {
        const children = menuItems.filter((c) => c.parentId === item.id).map(toNavItem)
        return { ...toNavItem(item), ...(children.length ? { children } : {}) }
      }),
    }))
    .filter((group) => group.items.length > 0)

  const bottomNavItems: NavItem[] = menuItems.filter((m) => m.showInBottomNav).map(toNavItem)

  return { navGroups, bottomNavItems, menuItems, loading: modulesLoading || menuItemsLoading }
}
