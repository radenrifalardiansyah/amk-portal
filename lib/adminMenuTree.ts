import type { AdminModule, AdminMenuItem } from '@/lib/services'

export interface MenuTreeRow {
  item: AdminMenuItem
  depth: number
  siblingIndex: number
  siblingCount: number
}

export interface ModuleMenuGroup {
  module: AdminModule
  rows: MenuTreeRow[]
}

function buildRowsForModule(items: AdminMenuItem[], moduleId: string): MenuTreeRow[] {
  const topLevel = items.filter((i) => i.moduleId === moduleId && !i.parentId).sort((a, b) => a.order - b.order)
  const rows: MenuTreeRow[] = []
  topLevel.forEach((top, idx) => {
    rows.push({ item: top, depth: 0, siblingIndex: idx, siblingCount: topLevel.length })
    const children = items.filter((i) => i.parentId === top.id).sort((a, b) => a.order - b.order)
    children.forEach((child, cIdx) => {
      rows.push({ item: child, depth: 1, siblingIndex: cIdx, siblingCount: children.length })
    })
  })
  return rows
}

/** Groups menu items by module (in module order), each group's rows ordered parent-then-children so both the Struktur Menu and Hak Akses pages render identical module -> menu hierarchy regardless of raw `order` values colliding across sibling groups. */
export function buildModuleMenuGroups(modules: AdminModule[], items: AdminMenuItem[]): ModuleMenuGroup[] {
  return modules
    .map((module) => ({ module, rows: buildRowsForModule(items, module.id) }))
    .filter((group) => group.rows.length > 0)
}
