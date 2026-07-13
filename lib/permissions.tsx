'use client'

import { createContext, useContext } from 'react'
import useSWR from 'swr'
import { rolePermissionService } from '@/lib/services'
import type { ModulePermission, SessionUser } from '@/lib/services'

const fullAccess: ModulePermission = { view: true, edit: true, delete: true, approve: true }
const noAccess: ModulePermission = { view: false, edit: false, delete: false, approve: false }

export interface PermissionContextValue {
  isAdminRole: boolean
  get(menuId: string): ModulePermission
}

export const PermissionContext = createContext<PermissionContextValue>({
  isAdminRole: false,
  get: () => fullAccess,
})

/** Computes the current user's permission map from their role's saved matrix (admin and editor both go through the matrix). Call once near the top of the authenticated layout and feed the result into PermissionContext.Provider so nested pages can read it via usePermission(). */
export function usePermissionValue(session: SessionUser | null): PermissionContextValue {
  const role = session?.role ?? 'editor'
  const { data: permissions } = useSWR(
    session ? ['role-permissions', role] : null,
    () => rolePermissionService.get(role),
  )

  return {
    isAdminRole: role === 'admin',
    get(menuId: string) {
      return permissions?.[menuId] ?? noAccess
    },
  }
}

export function usePermission(menuId: string): ModulePermission {
  const ctx = useContext(PermissionContext)
  return ctx.get(menuId)
}

export function usePermissionContext() {
  return useContext(PermissionContext)
}
