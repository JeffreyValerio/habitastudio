"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getWorkshopManager() {
  return await prisma.user.findFirst({
    where: { role: "taller-manager" },
  });
}

async function sendApprovalEmail(
  workshopManager: any,
  user: any,
  timeEntry: any,
  type: "entry" | "exit"
) {
  if (!workshopManager?.email) return;

  const approvalLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/taller-manager/approvals`;
  const typeLabel = type === "entry" ? "Entrada" : "Salida";
  const timeLabel = type === "entry" ? "entrada" : "salida";

  await resend.emails.send({
    from: "Habita Studio <info@habitastudio.online>",
    to: [workshopManager.email],
    replyTo: "info@habitastudio.online",
    subject: `Solicitud de aprobación de ${timeLabel} - ${user.name || user.email}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <style>
          @media (prefers-color-scheme: dark) {
            .btn-accept, .btn-accept a { background-color: #000000 !important; color: #ffffff !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px 20px 40px; text-align: center;">
                    <img src="https://habitastudio.online/images/logo.png" alt="Habita Studio" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px;">
                    <h2 style="margin: 20px 0; font-size: 24px; color: #333;">Solicitud de Aprobación</h2>
                    <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                      <strong>${user.name || user.email}</strong> ha registrado una <strong>${typeLabel}</strong>.
                    </p>

                    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                      <p style="margin: 10px 0;"><strong>Colaborador:</strong> ${user.name || "Sin nombre"}</p>
                      <p style="margin: 10px 0;"><strong>Email:</strong> ${user.email}</p>
                      <p style="margin: 10px 0;"><strong>Tipo:</strong> ${typeLabel}</p>
                      <p style="margin: 10px 0;"><strong>Hora:</strong> ${new Date(type === "entry" ? timeEntry.entryTime : timeEntry.exitTime).toLocaleTimeString("es-CR")}</p>
                    </div>

                    <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                      Por favor, revisa y aprueba o rechaza esta solicitud:
                    </p>

                    <table role="presentation" style="margin: 30px 0;">
                      <tr>
                        <td class="btn-accept" bgcolor="#000000" style="background-color: #000000 !important; border-radius: 5px; padding: 0; margin-right: 10px;">
                          <a href="${approvalLink}" style="background-color: #000000 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Ver Solicitudes
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      © Habita Studio. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

export async function clockIn(workOrderId?: string, workType?: string, description?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId: user.id,
      workOrderId: workOrderId || null,
      workType: workType || null,
      entryDate: new Date(),
      entryTime: new Date(),
      description: description || null,
    },
  });

  // Create approval request
  await prisma.timeApproval.create({
    data: {
      timeEntryId: timeEntry.id,
      type: "entry",
      status: "pending",
    },
  });

  // Send email to workshop manager
  const workshopManager = await getWorkshopManager();
  if (workshopManager) {
    await sendApprovalEmail(workshopManager, user, timeEntry, "entry");
  }

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

  // Create approval request for exit
  await prisma.timeApproval.create({
    data: {
      timeEntryId: updated.id,
      type: "exit",
      status: "pending",
    },
  });

  // Send email to workshop manager
  const workshopManager = await getWorkshopManager();
  if (workshopManager) {
    await sendApprovalEmail(workshopManager, user, updated, "exit");
  }

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
      workOrder: { select: { id: true, workOrderNumber: true } },
    },
  });

  if (!entry) return null;

  return {
    ...entry,
    entryTime: entry.entryTime.toISOString(),
    exitTime: entry.exitTime?.toISOString() || null,
    entryDate: entry.entryDate.toISOString(),
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
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
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
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver colaboradores");
  }

  const collaborators = await prisma.user.findMany({
    where: { isCollaborator: true },
    select: { id: true, name: true, email: true, hourlyRate: true, createdAt: true },
  });

  const { start, end } = getPeriodRange(params.year, params.month, params.quincena);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: { in: collaborators.map((c) => c.id) },
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
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver detalles");
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
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver registros");
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
  workOrderId: string;
  workType: string;
  entryDate: string;
  entryTime: string;
  exitTime?: string;
  description?: string;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    throw new Error("No autorizado para registrar horas manualmente");
  }

  if (!input.workOrderId) {
    throw new Error("Debes seleccionar una orden de trabajo");
  }
  if (!input.workType) {
    throw new Error("Debes seleccionar un tipo de labor");
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
      workOrderId: input.workOrderId,
      workType: input.workType,
      entryDate: new Date(input.entryDate),
      entryTime: entryDateTime,
      exitTime: exitDateTime,
      description: input.description || null,
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

export async function getPendingApprovals() {
  const user = await getCurrentUser();
  if (!user || user.role !== "taller-manager") {
    throw new Error("Solo jefes de taller pueden ver aprobaciones");
  }

  return await prisma.timeApproval.findMany({
    where: { status: "pending" },
    include: {
      timeEntry: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          workOrder: { select: { id: true, workOrderNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveTimeEntry(approvalId: string, approve: boolean, reason?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "taller-manager") {
    throw new Error("Solo jefes de taller pueden aprobar");
  }

  const approval = await prisma.timeApproval.findUnique({
    where: { id: approvalId },
  });

  if (!approval) {
    throw new Error("Aprobación no encontrada");
  }

  const updated = await prisma.timeApproval.update({
    where: { id: approvalId },
    data: {
      status: approve ? "approved" : "rejected",
      approvedBy: user.id,
      rejectionReason: !approve ? reason : null,
    },
    include: {
      timeEntry: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  revalidatePath("/taller-manager/approvals");
  return updated;
}
