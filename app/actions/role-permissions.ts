"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  CONFIGURABLE_ROLES,
  PERMISSION_SECTIONS_BY_ROLE,
  resolveSectionEnabled,
  type ConfigurableRole,
} from "@/lib/permissions";

function isConfigurableRole(role: string): role is ConfigurableRole {
  return (CONFIGURABLE_ROLES as string[]).includes(role);
}

// Mapa section -> enabled para un rol, mezclando overrides guardados con los
// valores por defecto. Cualquier rol no configurable (admin) no tiene secciones.
export async function getRolePermissionsMap(role: string): Promise<Record<string, boolean>> {
  if (!isConfigurableRole(role)) return {};

  const sections = PERMISSION_SECTIONS_BY_ROLE[role];
  if (sections.length === 0) return {};

  const overrideRows = await prisma.rolePermission.findMany({ where: { role } });
  const overrides = Object.fromEntries(overrideRows.map((r) => [r.section, r.enabled]));

  const result: Record<string, boolean> = {};
  for (const s of sections) {
    result[s.key] = resolveSectionEnabled(s.key, overrides);
  }
  return result;
}

export async function isSectionEnabledForRole(role: string, section: string): Promise<boolean> {
  if (role === "admin") return true;
  if (!isConfigurableRole(role)) return false;

  // La sección debe pertenecer al rol consultado; evita que un rol acceda a
  // una sección de otro portal (ej. collaborator pidiendo "admin.inventory").
  const belongsToRole = PERMISSION_SECTIONS_BY_ROLE[role].some((s) => s.key === section);
  if (!belongsToRole) return false;

  const override = await prisma.rolePermission.findUnique({
    where: { role_section: { role, section } },
  });
  if (override) return override.enabled;
  return resolveSectionEnabled(section, {});
}

// Combina getCurrentUser + chequeo de sección, para usar directamente en el
// gate de cada página.
export async function getSectionAccess(section: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, allowed: false };
  if (user.role === "admin") return { user, allowed: true };
  const allowed = await isSectionEnabledForRole(user.role, section);
  return { user, allowed };
}

export async function getAllRolePermissions(): Promise<Record<ConfigurableRole, Record<string, boolean>>> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver la configuración de permisos");
  }

  const result = {} as Record<ConfigurableRole, Record<string, boolean>>;
  for (const role of CONFIGURABLE_ROLES) {
    result[role] = await getRolePermissionsMap(role);
  }
  return result;
}

export async function setRolePermission(role: string, section: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden configurar permisos");
  }
  if (!isConfigurableRole(role)) {
    throw new Error("Rol no configurable");
  }

  await prisma.rolePermission.upsert({
    where: { role_section: { role, section } },
    update: { enabled },
    create: { role, section, enabled },
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/taller-manager", "layout");
  revalidatePath("/collaborator", "layout");
}
