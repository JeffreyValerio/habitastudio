"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function clockIn(projectId?: string, description?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId: user.id,
      projectId: projectId || null,
      entryDate: new Date(),
      entryTime: new Date(),
      description: description || null,
    },
  });

  revalidatePath("/dashboard");
  return timeEntry;
}

export async function clockOut(entryId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  });

  if (!timeEntry || timeEntry.userId !== user.id) {
    throw new Error("Entrada no encontrada");
  }

  if (timeEntry.exitTime) {
    throw new Error("Ya fue registrada la salida");
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      exitTime: new Date(),
    },
  });

  revalidatePath("/dashboard");
  return updated;
}

export async function getCollaboratorHours(userId: string, year?: number, month?: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver las horas");
  }

  const startDate = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
  const endDate = new Date(year || new Date().getFullYear(), (month || 1), 0);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
      exitTime: { not: null },
    },
    include: {
      project: { select: { title: true } },
    },
    orderBy: { entryDate: "desc" },
  });

  const totalHours = entries.reduce((sum, entry) => {
    if (entry.exitTime) {
      const diff = entry.exitTime.getTime() - entry.entryTime.getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  return {
    entries,
    totalHours: parseFloat(totalHours.toFixed(2)),
    period: `${year}-${String(month).padStart(2, "0")}`,
  };
}

export async function getMyCurrentEntry() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entry = await prisma.timeEntry.findFirst({
    where: {
      userId: user.id,
      entryDate: { gte: today },
      exitTime: null,
    },
    include: {
      project: { select: { id: true, title: true } },
    },
  });

  return entry;
}

export async function getCollaborators() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver colaboradores");
  }

  return await prisma.user.findMany({
    where: { isCollaborator: true },
    select: {
      id: true,
      name: true,
      email: true,
      hourlyRate: true,
      createdAt: true,
    },
  });
}

export async function calculatePayroll(userId: string, year: number, month: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden calcular nómina");
  }

  const collaborator = await prisma.user.findUnique({
    where: { id: userId },
    select: { hourlyRate: true },
  });

  if (!collaborator?.hourlyRate) {
    throw new Error("El colaborador no tiene tarifa establecida");
  }

  const { totalHours } = await getCollaboratorHours(userId, year, month);
  const period = `${year}-${String(month).padStart(2, "0")}`;

  const grossPay = totalHours * collaborator.hourlyRate;
  const deductions = 0; // Se puede expandir para descuentos
  const netPay = grossPay - deductions;

  const existing = await prisma.payroll.findUnique({
    where: {
      userId_period: { userId, period },
    },
  });

  if (existing) {
    return await prisma.payroll.update({
      where: { id: existing.id },
      data: {
        totalHours,
        hourlyRate: collaborator.hourlyRate,
        grossPay,
        deductions,
        netPay,
      },
    });
  }

  return await prisma.payroll.create({
    data: {
      userId,
      period,
      totalHours,
      hourlyRate: collaborator.hourlyRate,
      grossPay,
      deductions,
      netPay,
    },
  });
}
