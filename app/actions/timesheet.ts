"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
      purpose: "salary",
      entryDate: {
        gte: startDate,
        lte: endDate,
      },
      exitTime: { not: null },
    },
    include: {
      workOrder: { select: { workOrderNumber: true } },
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

// Lista liviana de colaboradores (sin tarifas) para registrar horas.
// Accesible también para el jefe de taller, que registra horas pero no ve precios.
export async function getCollaboratorsForTimeEntry() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager" && user.role !== "moderator")) {
    throw new Error("No autorizado");
  }

  return await prisma.user.findMany({
    where: { isCollaborator: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

function getPeriodRange(year: number, month: number, quincena?: 1 | 2) {
  const lastDay = new Date(year, month, 0).getDate();

  if (quincena === 1) {
    return {
      start: new Date(year, month - 1, 1, 0, 0, 0),
      end: new Date(year, month - 1, 15, 23, 59, 59, 999),
    };
  }
  if (quincena === 2) {
    return {
      start: new Date(year, month - 1, 16, 0, 0, 0),
      end: new Date(year, month - 1, lastDay, 23, 59, 59, 999),
    };
  }
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0),
    end: new Date(year, month - 1, lastDay, 23, 59, 59, 999),
  };
}

export async function getCollaboratorsWithEarnings(params: {
  year: number;
  month: number;
  quincena?: 1 | 2;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    throw new Error("No autorizado para ver colaboradores");
  }

  const collaborators = await prisma.user.findMany({
    where: { isCollaborator: true },
    select: { id: true, name: true, email: true, hourlyRate: true, createdAt: true },
  });

  const { start, end } = getPeriodRange(params.year, params.month, params.quincena);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: { in: collaborators.map((c) => c.id) },
      purpose: "salary",
      entryDate: { gte: start, lte: end },
      exitTime: { not: null },
    },
    select: { userId: true, entryTime: true, exitTime: true },
  });

  const hoursByUser = new Map<string, number>();
  entries.forEach((entry) => {
    const hours = (entry.exitTime!.getTime() - entry.entryTime.getTime()) / (1000 * 60 * 60);
    hoursByUser.set(entry.userId, (hoursByUser.get(entry.userId) || 0) + hours);
  });

  // Usar la tarifa vigente en el mes consultado (puede variar mes a mes),
  // no la tarifa "actual" fija del usuario.
  const { getEffectiveRatesBatch } = await import("@/app/actions/collaborator-rates");
  const rateRequests = collaborators.map((c) => ({ userId: c.id, year: params.year, month: params.month }));
  const rates = await getEffectiveRatesBatch(rateRequests);

  return collaborators.map((c) => {
    const hours = hoursByUser.get(c.id) || 0;
    const rate = rates[`${c.id}-${params.year}-${params.month}`] ?? c.hourlyRate ?? 0;
    const earned = hours * rate;
    return {
      ...c,
      hourlyRate: rate,
      hours: parseFloat(hours.toFixed(2)),
      earned: parseFloat(earned.toFixed(2)),
    };
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

export async function getCollaboratorDetails(userId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    throw new Error("No autorizado para ver detalles");
  }

  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      hourlyRate: true,
      createdAt: true,
    },
  });
}

export async function getCollaboratorTimeEntries(userId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    throw new Error("No autorizado para ver registros");
  }

  return await prisma.timeEntry.findMany({
    where: { userId },
    include: {
      workOrder: { select: { id: true, workOrderNumber: true } },
    },
    orderBy: { entryDate: "desc" },
  });
}

export async function updateCollaboratorRate(userId: string, hourlyRate: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden actualizar la tarifa");
  }

  if (hourlyRate < 0) {
    throw new Error("La tarifa no puede ser negativa");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { hourlyRate },
    select: { id: true, name: true, email: true, hourlyRate: true },
  });

  revalidatePath("/admin/time-management");
  revalidatePath(`/admin/time-management/${userId}`);
  return updated;
}

export async function createManualTimeEntry(input: {
  userId: string;
  workOrderId?: string;
  workType?: string;
  entryDate: string;
  entryTime: string;
  exitTime?: string;
  description?: string;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager" && user.role !== "moderator")) {
    throw new Error("No autorizado para registrar horas manualmente");
  }

  // El jefe de taller siempre registra horas de producción contra una orden de
  // trabajo (rebajan presupuesto, no cuentan para salario). Admin/moderador
  // registran horas de asistencia para nómina, sin necesidad de una orden.
  const isTallerManager = user.role === "taller-manager";
  const purpose = isTallerManager ? "budget" : "salary";

  if (isTallerManager) {
    if (!input.workOrderId) {
      throw new Error("Debes seleccionar una orden de trabajo");
    }
    if (!input.workType) {
      throw new Error("Debes seleccionar un tipo de labor");
    }
  }

  const collaborator = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!collaborator) {
    throw new Error("Colaborador no encontrado");
  }

  const entryDateTime = new Date(`${input.entryDate}T${input.entryTime}`);
  const exitDateTime = input.exitTime
    ? new Date(`${input.entryDate}T${input.exitTime}`)
    : null;

  if (exitDateTime && exitDateTime <= entryDateTime) {
    throw new Error("La hora de salida debe ser posterior a la hora de entrada");
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId: input.userId,
      workOrderId: input.workOrderId || null,
      workType: input.workType || null,
      entryDate: new Date(input.entryDate),
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      description: input.description || null,
      purpose,
    },
  });

  // Registrado directamente por un admin o jefe de taller: se marca como ya aprobado,
  // sin pasar por el flujo de aprobación.
  await prisma.timeApproval.create({
    data: {
      timeEntryId: timeEntry.id,
      type: "entry",
      status: "approved",
      approvedBy: user.id,
    },
  });

  if (exitDateTime) {
    await prisma.timeApproval.create({
      data: {
        timeEntryId: timeEntry.id,
        type: "exit",
        status: "approved",
        approvedBy: user.id,
      },
    });
  }

  revalidatePath(`/admin/time-management/${input.userId}`);
  revalidatePath("/admin/time-management");
  return timeEntry;
}

export async function updateManualTimeEntry(
  entryId: string,
  input: {
    workOrderId?: string;
    workType?: string;
    entryDate: string;
    entryTime: string;
    exitTime?: string;
    description?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden editar registros");
  }

  const entryDateTime = new Date(`${input.entryDate}T${input.entryTime}`);
  const exitDateTime = input.exitTime
    ? new Date(`${input.entryDate}T${input.exitTime}`)
    : null;

  if (exitDateTime && exitDateTime <= entryDateTime) {
    throw new Error("La hora de salida debe ser posterior a la hora de entrada");
  }

  const entry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      workOrderId: input.workOrderId || null,
      workType: input.workType || null,
      entryDate: new Date(input.entryDate),
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      description: input.description || null,
    },
  });

  revalidatePath(`/admin/time-management/${entry.userId}`);
  revalidatePath("/admin/time-management");
  return entry;
}

export async function deleteManualTimeEntry(entryId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar registros");
  }

  const entry = await prisma.timeEntry.delete({
    where: { id: entryId },
  });

  revalidatePath(`/admin/time-management/${entry.userId}`);
  revalidatePath("/admin/time-management");
  return entry;
}

