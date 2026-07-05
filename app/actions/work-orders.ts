"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver las órdenes de trabajo");
  }

  return await prisma.workOrder.findMany({
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
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      timeEntries: {
        select: {
          entryTime: true,
          exitTime: true,
          user: { select: { hourlyRate: true } },
        },
      },
      expenses: { select: { amount: true } },
      _count: { select: { timeEntries: true } },
    },
    orderBy: { createdAt: "desc" },
  });
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
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      timeEntries: {
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

  if (!workOrder.deliveryDate) {
    throw new Error("Esta orden aún no ha sido liberada");
  }

  if (user.role === "collaborator") {
    const isAssigned = workOrder.assignments.some((a) => a.userId === user.id);
    if (!isAssigned) throw new Error("No tienes acceso a esta orden de trabajo");
  } else if (user.role !== "taller-manager") {
    throw new Error("No autorizado");
  }

  // Ocultar información financiera sensible (tarifas y gastos) a roles no-admin
  return {
    ...workOrder,
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
    throw new Error("Solo administradores pueden liberar órdenes de trabajo");
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { deliveryDate: deliveryDate ? new Date(deliveryDate) : null },
  });

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${id}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return workOrder;
}

export async function updateWorkOrderStatus(
  id: string,
  status: "pending" | "in_progress" | "completed"
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    throw new Error("No autorizado");
  }

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/work-orders");
  revalidatePath(`/admin/work-orders/${id}`);
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return workOrder;
}

export async function assignCollaboratorToWorkOrder(
  workOrderId: string,
  userId: string,
  workType: string
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    throw new Error("No autorizado");
  }

  const assignment = await prisma.workOrderAssignment.create({
    data: { workOrderId, userId, workType },
  });

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/admin/work-orders");
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return assignment;
}

export async function removeWorkOrderAssignment(assignmentId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "taller-manager")) {
    throw new Error("No autorizado");
  }

  const assignment = await prisma.workOrderAssignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath(`/admin/work-orders/${assignment.workOrderId}`);
  revalidatePath("/admin/work-orders");
  revalidatePath("/taller-manager/work-orders");
  revalidatePath("/collaborator/work-orders");
  return assignment;
}

// Órdenes visibles en el panel de "activas": solo las liberadas (con fecha de entrega) y no completadas.
// Jefe de taller ve todas; colaborador solo las suyas.
export async function getActiveWorkOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  if (user.role === "admin" || user.role === "taller-manager") {
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
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { deliveryDate: "asc" },
    });
  }

  if (user.role === "collaborator") {
    return await prisma.workOrder.findMany({
      where: {
        deliveryDate: { not: null },
        status: { not: "completed" },
        assignments: { some: { userId: user.id } },
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
        assignments: { where: { userId: user.id }, select: { workType: true } },
      },
      orderBy: { deliveryDate: "asc" },
    });
  }

  return [];
}

// Para el selector de "Registrar Horas" del admin: órdenes no completadas
export async function getWorkOrdersForSelect() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("No autorizado");
  }

  return await prisma.workOrder.findMany({
    where: { status: { not: "completed" } },
    select: {
      id: true,
      workOrderNumber: true,
      quote: { select: { clientName: true, projectName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Órdenes activas asignadas al colaborador logueado, para elegir al marcar entrada/salida
export async function getMyActiveWorkOrdersForClock() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");

  return await prisma.workOrder.findMany({
    where: {
      deliveryDate: { not: null },
      status: { not: "completed" },
      assignments: { some: { userId: user.id } },
    },
    select: {
      id: true,
      workOrderNumber: true,
      quote: { select: { clientName: true, projectName: true } },
      assignments: { where: { userId: user.id }, select: { workType: true } },
    },
    orderBy: { deliveryDate: "asc" },
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
    throw new Error("Solo administradores pueden registrar gastos");
  }

  // Gasto desde inventario: descuenta stock y calcula el monto automáticamente
  if ("materialId" in input) {
    if (input.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a cero");
    }

    return await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: input.materialId } });
      if (!material) throw new Error("Material no encontrado");
      if (material.quantity < input.quantity) {
        throw new Error(`Stock insuficiente de ${material.name} (disponible: ${material.quantity} ${material.unit})`);
      }

      const amount = material.costPerUnit * input.quantity;
      const workOrder = await tx.workOrder.findUnique({ where: { id: workOrderId }, select: { workOrderNumber: true } });

      const expense = await tx.workOrderExpense.create({
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

      revalidatePath(`/admin/work-orders/${workOrderId}`);
      revalidatePath("/admin/work-orders");
      revalidatePath("/admin/inventory");
      return expense;
    });
  }

  // Gasto manual
  if (input.amount <= 0) {
    throw new Error("El monto debe ser mayor a cero");
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
  return expense;
}

export async function deleteWorkOrderExpense(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar gastos");
  }

  return await prisma.$transaction(async (tx) => {
    const expense = await tx.workOrderExpense.delete({ where: { id } });

    // Si el gasto venía de inventario, devolver el stock consumido
    if (expense.materialId && expense.quantity) {
      await tx.material.update({
        where: { id: expense.materialId },
        data: { quantity: { increment: expense.quantity } },
      });

      await tx.materialMovement.create({
        data: {
          materialId: expense.materialId,
          type: "in",
          quantity: expense.quantity,
          reference: "Reversión por eliminación de gasto",
          createdBy: user.id,
        },
      });
    }

    revalidatePath(`/admin/work-orders/${expense.workOrderId}`);
    revalidatePath("/admin/work-orders");
    revalidatePath("/admin/inventory");
    return expense;
  });
}
