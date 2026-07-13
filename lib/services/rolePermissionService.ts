import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { menuItemsService } from './menuItemsService'

export type Role = 'admin' | 'editor'

export interface ModulePermission {
  view: boolean
  edit: boolean
  delete: boolean
  approve: boolean
}

export type PermissionMap = Record<string, ModulePermission>

export interface RolePermission {
  role: Role
  permissions: PermissionMap
}

const COL = 'role_permissions'

const fullAccess: ModulePermission = { view: true, edit: true, delete: true, approve: true }
const noAccess: ModulePermission = { view: false, edit: false, delete: false, approve: false }

export const rolePermissionService = {
  async get(role: Role): Promise<PermissionMap> {
    try {
      const [snap, menuItems] = await Promise.all([
        getDoc(doc(db, COL, role)),
        menuItemsService.getAll(),
      ])
      const saved = snap.exists() ? (snap.data() as RolePermission).permissions : {}
      const defaults: PermissionMap = {}
      menuItems.forEach((m) => { defaults[m.id] = { ...noAccess } })
      // Merge over defaults so newly added menu items default to no-access instead of throwing on lookup.
      return { ...defaults, ...saved }
    } catch {
      return {}
    }
  },

  async save(role: Role, permissions: PermissionMap): Promise<void> {
    await setDoc(doc(db, COL, role), { role, permissions })
  },

  async seedDefaults(): Promise<boolean> {
    const [adminSnap, editorSnap] = await Promise.all([
      getDoc(doc(db, COL, 'admin')),
      getDoc(doc(db, COL, 'editor')),
    ])
    if (adminSnap.exists() || editorSnap.exists()) return false

    const menuItems = await menuItemsService.getAll()
    const fullMap: PermissionMap = {}
    menuItems.forEach((m) => { fullMap[m.id] = { ...fullAccess } })

    await Promise.all([
      setDoc(doc(db, COL, 'admin'), { role: 'admin', permissions: fullMap }),
      setDoc(doc(db, COL, 'editor'), { role: 'editor', permissions: fullMap }),
    ])
    return true
  },
}
