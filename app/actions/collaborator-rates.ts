"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden gestionar tarifas");
  }
  return user;
}

// Fija (o actualiza) la tarifa de un colaborador a partir de un mes específico.
// Ese valor rige desde ese mes en adelante hasta que se fije una tarifa más reciente.
export async function setCollaboratorRate(
  userId: string,
  year: number,
  month: number,
  hourlyRate: number
) {
  await requireAdmin();

  if (hourlyRate < 0) {
    throw new Error("La tarifa no puede ser negativa");
  }

  const rate = await prisma.collaboratorRate.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: { hourlyRate },
    create: { userId, year, month, hourlyRate },
  });

  // Mantener sincronizado el campo base del usuario con la tarifa vigente
  // más reciente, para que listados simples (ej. tabla de Usuarios) sigan
  // mostrando un valor "actual" razonable.
  const latest = await prisma.collaboratorRate.findFirst({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  if (latest) {
    await prisma.user.update({ where: { id: userId }, data: { hourlyRate: latest.hourlyRate } });
  }

  revalidatePath("/admin/time-management");
  revalidatePath(`/admin/time-management/${userId}`);
  revalidatePath("/admin/settings/users");
  return rate;
}

export async function getCollaboratorRateHistory(userId: string) {
  await requireAdmin();

  return await prisma.collaboratorRate.findMany({
    where: { userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function deleteCollaboratorRate(id: string) {
  await requireAdmin();

  const rate = await prisma.collaboratorRate.delete({ where: { id } });

  revalidatePath("/admin/time-management");
  revalidatePath(`/admin/time-management/${rate.userId}`);
  return rate;
}

// Tarifa vigente de un colaborador para un año/mes específico: la más
// reciente fijada en ese mes o antes; si no hay ninguna, cae al hourlyRate
// base del usuario (compatibilidad con tarifas fijadas a la manera antigua).
export async function getEffectiveRate(userId: string, year: number, month: number): Promise<number> {
  await requireAdmin();

  const rate = await prisma.collaboratorRate.findFirst({
    where: {
      userId,
      OR: [{ year: { lt: year } }, { year, month: { lte: month } }],
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  if (rate) return rate.hourlyRate;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hourlyRate: true } });
  return user?.hourlyRate || 0;
}

// Resuelve tarifas para varias combinaciones (userId, year, month) a la vez,
// evitando N+1 queries cuando se calculan costos sobre muchas entradas de tiempo.
export async function getEffectiveRatesBatch(
  requests: { userId: string; year: number; month: number }[]
): Promise<Record<string, number>> {
  await requireAdmin();

  if (requests.length === 0) return {};

  const userIds = Array.from(new Set(requests.map((r) => r.userId)));

  const [allRates, users] = await Promise.all([
    prisma.collaboratorRate.findMany({ where: { userId: { in: userIds } } }),
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, hourlyRate: true } }),
  ]);

  const baseRates = new Map(users.map((u) => [u.id, u.hourlyRate || 0]));

  const result: Record<string, number> = {};
  for (const req of requests) {
    const key = `${req.userId}-${req.year}-${req.month}`;
    const candidates = allRates
      .filter(
        (r) =>
          r.userId === req.userId &&
          (r.year < req.year || (r.year === req.year && r.month <= req.month))
      )
      .sort((a, b) => b.year - a.year || b.month - a.month);
    result[key] = candidates[0]?.hourlyRate ?? baseRates.get(req.userId) ?? 0;
  }
  return result;
}
