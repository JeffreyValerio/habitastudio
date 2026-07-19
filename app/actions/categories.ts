"use server";

import prisma from "@/lib/prisma";
import { getSectionAccess } from "@/app/actions/role-permissions";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(name: string) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return { ok: false as const, message: "No autorizado" };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false as const, message: "El nombre de la categoría es requerido" };
  }

  try {
    const existing = await prisma.category.findUnique({ where: { name: trimmed } });
    if (existing) {
      return { ok: true as const, category: existing };
    }

    const category = await prisma.category.create({ data: { name: trimmed } });
    return { ok: true as const, category };
  } catch (error: any) {
    return {
      ok: false as const,
      message: `No se pudo crear la categoría: ${error?.message || String(error)}`,
    };
  }
}
