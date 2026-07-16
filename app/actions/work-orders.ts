"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateLaborCost, calculateExpensesCost } from "@/lib/work-order-costs";
import { uploadImages } from "@/lib/cloudinary";
import { WORK_ORDER_STATUS_LABELS, WORK_ORDER_STAGES, WORK_ORDER_STAGE_LABELS, WorkOrderStage } from "@/lib/work-order-types";
import { getSectionAccess } from "@/app/actions/role-permissions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Notifica a todos los administradores cuando alguien cambia el estado de una
// orden de trabajo, indicando quién la movió y a qué estado quedó.
async function sendWorkOrderStatusChangeEmail(
  workOrder: {
    id: string;
    workOrderNumber: string;
    status: string;
    quote: { clientName: string; projectName: string; customer: { name: string } | null };
  },
  changedBy: { name: string | null; email: string }
) {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });
  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  if (adminEmails.length === 0) return;

  const workOrderLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/work-orders/${workOrder.id}`;
  const statusLabel = WORK_ORDER_STATUS_LABELS[workOrder.status] || workOrder.status;
  const clientName = workOrder.quote.customer?.name || workOrder.quote.clientName;

  try {
    await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: adminEmails,
      replyTo: "info@habitastudio.online",
      subject: `${workOrder.workOrderNumber} cambió a "${statusLabel}"`,
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
                      <h2 style="margin: 20px 0; font-size: 24px; color: #333;">Cambio de Estado</h2>
                      <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                        <strong>${changedBy.name || changedBy.email}</strong> cambió el estado de la orden de trabajo <strong>${workOrder.workOrderNumber}</strong>.
                      </p>

                      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                        <p style="margin: 10px 0;"><strong>Orden:</strong> ${workOrder.workOrderNumber}</p>
                        <p style="margin: 10px 0;"><strong>Cliente:</strong> ${clientName} — ${workOrder.quote.projectName}</p>
                        <p style="margin: 10px 0;"><strong>Nuevo estado:</strong> ${statusLabel}</p>
                        <p style="margin: 10px 0;"><strong>Cambiado por:</strong> ${changedBy.name || "Sin nombre"} (${changedBy.email})</p>
                      </div>

                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td class="btn-accept" bgcolor="#000000" style="background-color: #000000 !important; border-radius: 5px; padding: 0; margin-right: 10px;">
                            <a href="${workOrderLink}" style="background-color: #000000 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                              Ver Orden de Trabajo
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
  } catch (error) {
    console.error("Error al enviar notificación de cambio de estado:", error);
  }
}

// Notifica a todos los administradores cuando el jefe de taller (o admin) marca
// una etapa de producción, para que sepan en qué fase va la orden.
async function sendWorkOrderStageEmail(
  workOrder: {
    id: string;
    workOrderNumber: string;
    quote: { clientName: string; projectName: string; customer: { name: string } | null };
  },
  stage: WorkOrderStage,
  markedBy: { name: string | null; email: string }
) {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });
  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  if (adminEmails.length === 0) return;

  const workOrderLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/work-orders/${workOrder.id}`;
  const stageLabel = WORK_ORDER_STAGE_LABELS[stage] || stage;
  const clientName = workOrder.quote.customer?.name || workOrder.quote.clientName;

  try {
    await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: adminEmails,
      replyTo: "info@habitastudio.online",
      subject: `${workOrder.workOrderNumber} completó la etapa "${stageLabel}"`,
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
                      <h2 style="margin: 20px 0; font-size: 24px; color: #333;">Etapa de Producción Completada</h2>
                      <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                        <strong>${markedBy.name || markedBy.email}</strong> marcó la etapa <strong>${stageLabel}</strong> de la orden de trabajo <strong>${workOrder.workOrderNumber}</strong>.
                      </p>

                      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                        <p style="margin: 10px 0;"><strong>Orden:</strong> ${workOrder.workOrderNumber}</p>
                        <p style="margin: 10px 0;"><strong>Cliente:</strong> ${clientName} — ${workOrder.quote.projectName}</p>
                        <p style="margin: 10px 0;"><strong>Etapa completada:</strong> ${stageLabel}</p>
                        <p style="margin: 10px 0;"><strong>Marcada por:</strong> ${markedBy.name || "Sin nombre"} (${markedBy.email})</p>
                      </div>

                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td class="btn-accept" bgcolor="#000000" style="background-color: #000000 !important; border-radius: 5px; padding: 0; margin-right: 10px;">
                            <a href="${workOrderLink}" style="background-color: #000000 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                              Ver Orden de Trabajo
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
  } catch (error) {
    console.error("Error al enviar notificación de etapa:", error);
  }
}

export async function markWorkOrderStage(workOrderId: string, stage: WorkOrderStage) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    return { ok: false as const, message: "No autorizado" };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      quote: {
        select: {
          clientName: true,
          projectName: true,
          customer: { select: { name: true } },
        },
      },
    },
  });
  if (!workOrder) return { ok: false as const, message: "Orden de trabajo no encontrada" };

  const stageIndex = WORK_ORDER_STAGES.findIndex((s) => s.key === stage);
  const targetStage = WORK_ORDER_STAGES[stageIndex];

  // Verificar que todas las etapas anteriores ya estén completadas (orden estricto)
  for (let i = 0; i < stageIndex; i++) {
    const priorField = WORK_ORDER_STAGES[i].field;
    if (!workOrder[priorField]) {
      return { ok: false as const, message: `Debes completar "${WORK_ORDER_STAGES[i].label}" antes de marcar "${targetStage.label}"` };
    }
  }

  if (workOrder[targetStage.field]) {
    return { ok: false as const, message: `"${targetStage.label}" ya fue marcada como completada` };
  }

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { [targetStage.field]: new Date() },
    include: {
      quote: {
        select: {
          clientName: true,
          projectName: true,
          customer: { select: { name: true } },
        },
      },
    },
  });

  await sendWorkOrderStageEmail(updated, stage, user);

  // La última etapa (instalado) cierra automáticamente la orden.
  if (stage === "instalado") {
    await updateWorkOrderStatus(workOrderId, "completed");
  }

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath(`/taller-manager/work-orders/${workOrderId}`);
  return { ok: true as const, workOrder: updated };
}

// Permite al admin corregir una etapa marcada por error. Solo se puede
// reversar la última etapa completada (no se puede dejar un hueco en medio
// de la secuencia estricta).
export async function revertWorkOrderStage(workOrderId: string, stage: WorkOrderStage) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo un administrador puede reversar una etapa" };
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) return { ok: false as const, message: "Orden de trabajo no encontrada" };

  const stageIndex = WORK_ORDER_STAGES.findIndex((s) => s.key === stage);
  const targetStage = WORK_ORDER_STAGES[stageIndex];

  if (!workOrder[targetStage.field]) {
    return { ok: false as const, message: `"${targetStage.label}" no está marcada como completada` };
  }

  for (let i = stageIndex + 1; i < WORK_ORDER_STAGES.length; i++) {
    if (workOrder[WORK_ORDER_STAGES[i].field]) {
      return { ok: false as const, message: `Debes reversar primero "${WORK_ORDER_STAGES[i].label}"` };
    }
  }

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      [targetStage.field]: null,
      // Instalado completa automáticamente la OT; al reversarla, reabrirla.
      ...(stage === "instalado" && workOrder.status === "completed" ? { status: "in_progress" } : {}),
    },
  });

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath(`/taller-manager/work-orders/${workOrderId}`);
  return { ok: true as const, workOrder: updated };
}

async function generateWorkOrderNumber() {
  const currentYear = new Date().getFullYear();

  return await prisma.$transaction(async (tx) => {
    const sequence = await tx.workOrderSequence.findUnique({
      where: { year: currentYear },
    });

    if (!sequence) {
      await tx.workOrderSequence.create({
        data: { year: currentYear, lastNumber: 0 },
      });
    }

    let nextNumber = (sequence?.lastNumber || 0) + 1;

    // Protección extra contra carreras: revisar la última orden real del año
    const lastOfYear = await tx.workOrder.findFirst({
      where: { workOrderNumber: { startsWith: `OT-${currentYear}-` } },
      orderBy: { createdAt: "desc" },
      select: { workOrderNumber: true },
    });
    if (lastOfYear) {
      const lastNumber = parseInt(lastOfYear.workOrderNumber.split("-").pop() || "0", 10) || 0;
      if (lastNumber >= nextNumber) {
        nextNumber = lastNumber + 1;
      }
    }

    await tx.workOrderSequence.update({
      where: { year: currentYear },
      data: { lastNumber: nextNumber },
    });

    const padded = String(nextNumber).padStart(4, "0");
    return `OT-${currentYear}-${padded}`;
  });
}

// Crea la orden de trabajo de una cotización si no existe aún.
// Se llama automáticamente al aceptar una cotización, y también puede
// invocarse manualmente para cotizaciones aceptadas antes de este feature.
export async function createWorkOrderForQuote(quoteId: string) {
  const existing = await prisma.workOrder.findUnique({ where: { quoteId } });
  if (existing) return existing;

  const workOrderNumber = await generateWorkOrderNumber();

  const workOrder = await prisma.workOrder.create({
    data: {
      quoteId,
      workOrderNumber,
      status: "pending",
    },
  });

  revalidatePath("/admin/work-orders");
  return workOrder;
}

export async function getWorkOrders() {
  const { allowed } = await getSectionAccess("admin.work-orders");
  if (!allowed) {
    throw new Error("No autorizado para ver las órdenes de trabajo");
  }

  const workOrders = await prisma.workOrder.findMany({
    include: {
      quote: {
        select: {
          quoteNumber: true,
          clientName: true,
          projectName: true,
          total: true,
          customer: { select: { id: true, name: true } },
        },
      },
      timeEntries: {
        where: { purpose: "budget" },
        select: {
          entryDate: true,
          entryTime: true,
          exitTime: true,
          user: { select: { id: true, hourlyRate: true } },
        },
      },
      expenses: { select: { amount: true } },
      _count: { select: { timeEntries: { where: { purpose: "budget" } } } },
    },
    orderBy: { deliveryDate: { sort: "asc", nulls: "last" } },
  });

  // Costeo de mano de obra según la tarifa vigente en el mes de cada entrada,
  // calculado aquí porque requiere acceso a la base de datos (no se puede hacer en el cliente).
  return await Promise.all(
    workOrders.map(async (wo) => {
      const laborCost = await calculateLaborCost(wo.timeEntries);
      const expensesCost = calculateExpensesCost(wo.expenses);
      const spent = laborCost + expensesCost;
      const percentUsed = wo.quote.total > 0 ? Math.min((spent / wo.quote.total) * 100, 100) : 0;
      return { ...wo, spent, percentUsed };
    })
  );
}

export async function getWorkOrder(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      quote: {
        include: {
          customer: true,
          items: true,
        },
      },
      timeEntries: {
        where: { purpose: "budget" },
        include: { user: { select: { id: true, name: true, hourlyRate: true } } },
        orderBy: { entryDate: "desc" },
      },
      expenses: {
        include: { creator: { select: { id: true, name: true } } },
        orderBy: { expenseDate: "desc" },
      },
    },
  });

  if (!workOrder) return null;

  if (user.role === "admin") return workOrder;

  if (user.role !== "taller-manager" && user.role !== "collaborator") {
    throw new Error("No autorizado");
  }

  // El jefe de taller y el colaborador solo ven la orden una vez que
  // el admin la libera poniéndole fecha de entrega.
  if (!workOrder.deliveryDate) {
    throw new Error("Esta orden aún no ha sido liberada");
  }

  // Ocultar información financiera sensible (precios, tarifas y gastos) a roles no-admin
  return {
    ...workOrder,
    quote: {
      ...workOrder.quote,
      total: 0,
      items: workOrder.quote.items.map((item) => ({ ...item, unitPrice: 0, total: 0 })),
    },
    expenses: [],
    timeEntries: workOrder.timeEntries.map((entry) => ({
      ...entry,
      user: { ...entry.user, hourlyRate: null },
    })),
  };
}

export async function setWorkOrderDeliveryDate(id: string, deliveryDate: string | null) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo administradores pueden liberar órdenes de trabajo" };
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { deliveryDate: deliveryDate ? new Date(deliveryDate) : null },
  });

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${id}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return { ok: true as const, workOrder };
}

export async function updateWorkOrderStatus(
  id: string,
  status: "pending" | "in_progress" | "completed"
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    return { ok: false as const, message: "No autorizado" };
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { status },
    include: {
      quote: {
        select: {
          clientName: true,
          projectName: true,
          customer: { select: { name: true } },
        },
      },
    },
  });

  await sendWorkOrderStatusChangeEmail(workOrder, user);

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${id}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return { ok: true as const, workOrder };
}

// Órdenes visibles en el panel de "activas". El admin ve cualquier orden en
// cuanto existe (liberada o no); jefe de taller y colaborador solo las liberadas.
export async function getActiveWorkOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  if (user.role === "admin") {
    return await prisma.workOrder.findMany({
      where: { status: { not: "completed" } },
      include: {
        quote: {
          select: {
            quoteNumber: true,
            clientName: true,
            projectName: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { deliveryDate: { sort: "asc", nulls: "last" } },
    });
  }

  if (user.role === "taller-manager" || user.role === "collaborator") {
    return await prisma.workOrder.findMany({
      where: {
        deliveryDate: { not: null },
        status: { not: "completed" },
      },
      include: {
        quote: {
          select: {
            quoteNumber: true,
            clientName: true,
            projectName: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { deliveryDate: "asc" },
    });
  }

  return [];
}

// Para el selector de "Registrar Horas": órdenes no completadas. El jefe de
// taller solo puede elegir órdenes ya liberadas (con fecha de entrega).
export async function getWorkOrdersForSelect() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager" && user.role !== "moderator")) {
    throw new Error("No autorizado");
  }

  return await prisma.workOrder.findMany({
    where: {
      status: { not: "completed" },
      ...(user.role === "taller-manager" ? { deliveryDate: { not: null } } : {}),
    },
    select: {
      id: true,
      workOrderNumber: true,
      quote: { select: { clientName: true, projectName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addWorkOrderExpense(
  workOrderId: string,
  input:
    | { category: string; description: string; amount: number; expenseDate?: string }
    | { materialId: string; quantity: number }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo administradores pueden registrar gastos" };
  }

  // Gasto desde inventario: descuenta stock y calcula el monto automáticamente
  if ("materialId" in input) {
    if (input.quantity <= 0) {
      return { ok: false as const, message: "La cantidad debe ser mayor a cero" };
    }

    const material = await prisma.material.findUnique({ where: { id: input.materialId } });
    if (!material) return { ok: false as const, message: "Material no encontrado" };
    if (material.quantity < input.quantity) {
      return { ok: false as const, message: `Stock insuficiente de ${material.name} (disponible: ${material.quantity} ${material.unit})` };
    }

    const expense = await prisma.$transaction(async (tx) => {
      const amount = material.costPerUnit * input.quantity;
      const workOrder = await tx.workOrder.findUnique({ where: { id: workOrderId }, select: { workOrderNumber: true } });

      const created = await tx.workOrderExpense.create({
        data: {
          workOrderId,
          category: "materiales",
          description: `${material.name} (${input.quantity} ${material.unit})`,
          amount,
          quantity: input.quantity,
          materialId: material.id,
          createdBy: user.id,
        },
      });

      await tx.material.update({
        where: { id: material.id },
        data: { quantity: { decrement: input.quantity } },
      });

      await tx.materialMovement.create({
        data: {
          materialId: material.id,
          type: "out",
          quantity: input.quantity,
          reference: workOrder?.workOrderNumber || workOrderId,
          createdBy: user.id,
        },
      });

      return created;
    });

    revalidatePath(`/admin/work-orders/${workOrderId}`);
    revalidatePath("/admin/work-orders");
    revalidatePath("/admin/inventory");
    return { ok: true as const, expense };
  }

  // Gasto manual
  if (input.amount <= 0) {
    return { ok: false as const, message: "El monto debe ser mayor a cero" };
  }

  const expense = await prisma.workOrderExpense.create({
    data: {
      workOrderId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      createdBy: user.id,
    },
  });

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/admin/work-orders");
  return { ok: true as const, expense };
}

export async function deleteWorkOrderExpense(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo administradores pueden eliminar gastos" };
  }

  const expense = await prisma.$transaction(async (tx) => {
    const deleted = await tx.workOrderExpense.delete({ where: { id } });

    // Si el gasto venía de inventario, devolver el stock consumido
    if (deleted.materialId && deleted.quantity) {
      await tx.material.update({
        where: { id: deleted.materialId },
        data: { quantity: { increment: deleted.quantity } },
      });

      await tx.materialMovement.create({
        data: {
          materialId: deleted.materialId,
          type: "in",
          quantity: deleted.quantity,
          reference: "Reversión por eliminación de gasto",
          createdBy: user.id,
        },
      });
    }

    return deleted;
  });

  revalidatePath(`/admin/work-orders/${expense.workOrderId}`);
  revalidatePath("/admin/work-orders");
  revalidatePath("/admin/inventory");
  return { ok: true as const, expense };
}

export async function addWorkOrderImages(workOrderId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo administradores pueden subir imágenes" };
  }

  const files = formData.getAll("images") as File[];
  if (files.length === 0) {
    return { ok: false as const, message: "No se recibieron imágenes" };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { images: true },
  });
  if (!workOrder) return { ok: false as const, message: "Orden de trabajo no encontrada" };

  const uploaded = await uploadImages(files, "habita-studio/work-orders");

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { images: [...workOrder.images, ...uploaded] },
  });

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath(`/taller-manager/work-orders/${workOrderId}`);
  return { ok: true as const, workOrder: updated };
}

export async function removeWorkOrderImage(workOrderId: string, imageUrl: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false as const, message: "Solo administradores pueden eliminar imágenes" };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { images: true },
  });
  if (!workOrder) return { ok: false as const, message: "Orden de trabajo no encontrada" };

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { images: workOrder.images.filter((u) => u !== imageUrl) },
  });

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath(`/taller-manager/work-orders/${workOrderId}`);
  return { ok: true as const, workOrder: updated };
}
