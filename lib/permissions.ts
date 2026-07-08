import {
  ADMIN_NAV_GROUPS,
  TALLER_MANAGER_NAV_ITEMS,
  COLLABORATOR_NAV_ITEMS,
  type NavGroup,
} from "./admin-navigation";

export type ConfigurableRole = "moderator" | "collaborator" | "taller-manager";

export const CONFIGURABLE_ROLES: ConfigurableRole[] = ["moderator", "collaborator", "taller-manager"];

export const CONFIGURABLE_ROLE_LABELS: Record<ConfigurableRole, string> = {
  moderator: "Moderador",
  collaborator: "Colaborador",
  "taller-manager": "Jefe de Taller",
};

export interface PermissionSection {
  key: string;
  label: string;
  group: string;
}

function collectSections(groups: NavGroup[]): PermissionSection[] {
  const out: PermissionSection[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      if (item.section) out.push({ key: item.section, label: item.name, group: g.group });
    }
  }
  return out;
}

export const PERMISSION_SECTIONS_BY_ROLE: Record<ConfigurableRole, PermissionSection[]> = {
  moderator: collectSections(ADMIN_NAV_GROUPS),
  "taller-manager": collectSections([{ group: "Portal Jefe de Taller", items: TALLER_MANAGER_NAV_ITEMS }]),
  collaborator: collectSections([{ group: "Portal Colaborador", items: COLLABORATOR_NAV_ITEMS }]),
};

// Estado por defecto = el comportamiento del sistema antes de esta
// configuración, para que activarla no cambie nada hasta que el admin
// explícitamente toque un switch. Cualquier sección no listada aquí
// se asume habilitada (true) por defecto.
export const DEFAULT_SECTION_ENABLED: Record<string, boolean> = {
  "admin.crm.customers": false,
  "admin.work-orders": false,
  "admin.inventory": false,
  "admin.settings.users": false,
};

export function resolveSectionEnabled(
  section: string,
  overrides: Record<string, boolean>
): boolean {
  if (section in overrides) return overrides[section];
  return DEFAULT_SECTION_ENABLED[section] ?? true;
}
