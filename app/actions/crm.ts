"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ CUSTOMERS ============

export async function getCustomers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver clientes");
  }

  return await prisma.customer.findMany({
    include: {
      interactions: { orderBy: { createdAt: "desc" }, take: 1 },
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
      tags: true,
      _count: { select: { quotes: true, interactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver clientes");
  }

  return await prisma.customer.findUnique({
    where: { id },
    include: {
      interactions: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      tags: true,
      quotes: { orderBy: { createdAt: "desc" } },
      _count: { select: { quotes: true, interactions: true } },
    },
  });
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  country?: string;
  source?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden crear clientes");
  }

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      position: data.position || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
      source: data.source || null,
    },
  });

  revalidatePath("/admin/crm/customers");
  return customer;
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    address?: string;
    city?: string;
    country?: string;
    status?: string;
    source?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden editar clientes");
  }

  const customer = await prisma.customer.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/crm/customers");
  revalidatePath(`/admin/crm/customers/${id}`);
  return customer;
}

export async function deleteCustomer(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar clientes");
  }

  await prisma.customer.delete({
    where: { id },
  });

  revalidatePath("/admin/crm/customers");
}

// ============ INTERACTIONS ============

export async function addInteraction(customerId: string, data: {
  type: string;
  subject: string;
  notes?: string;
  outcome?: string;
  duration?: number;
  participants?: string[];
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden agregar interacciones");
  }

  const interaction = await prisma.customerInteraction.create({
    data: {
      customerId,
      type: data.type,
      subject: data.subject,
      notes: data.notes || null,
      outcome: data.outcome || null,
      duration: data.duration || null,
      participants: data.participants || [],
    },
  });

  // Update customer's lastInteraction
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastInteraction: new Date() },
  });

  revalidatePath(`/admin/crm/customers/${customerId}`);
  return interaction;
}

export async function getInteractions(customerId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver interacciones");
  }

  return await prisma.customerInteraction.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteInteraction(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar interacciones");
  }

  const interaction = await prisma.customerInteraction.findUnique({
    where: { id },
  });

  if (!interaction) throw new Error("Interacción no encontrada");

  await prisma.customerInteraction.delete({
    where: { id },
  });

  revalidatePath(`/admin/crm/customers/${interaction.customerId}`);
}

// ============ NOTES ============

export async function addNote(customerId: string, data: {
  title: string;
  content: string;
  priority?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden agregar notas");
  }

  const note = await prisma.customerNote.create({
    data: {
      customerId,
      title: data.title,
      content: data.content,
      priority: data.priority || "normal",
    },
  });

  revalidatePath(`/admin/crm/customers/${customerId}`);
  return note;
}

export async function getNotes(customerId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver notas");
  }

  return await prisma.customerNote.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteNote(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar notas");
  }

  const note = await prisma.customerNote.findUnique({
    where: { id },
  });

  if (!note) throw new Error("Nota no encontrada");

  await prisma.customerNote.delete({
    where: { id },
  });

  revalidatePath(`/admin/crm/customers/${note.customerId}`);
}

// ============ TAGS ============

export async function getTags() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver tags");
  }

  return await prisma.customerTag.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createTag(data: {
  name: string;
  color?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden crear tags");
  }

  return await prisma.customerTag.create({
    data: {
      name: data.name,
      color: data.color || "#3b82f6",
    },
  });
}

export async function addTagToCustomer(customerId: string, tagId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden asignar tags");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      tags: { connect: { id: tagId } },
    },
  });

  revalidatePath(`/admin/crm/customers/${customerId}`);
}

export async function removeTagFromCustomer(customerId: string, tagId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden remover tags");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      tags: { disconnect: { id: tagId } },
    },
  });

  revalidatePath(`/admin/crm/customers/${customerId}`);
}

// ============ CRM ANALYTICS ============

export async function getCRMAnalytics() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver analíticas");
  }

  const customers = await prisma.customer.findMany({
    include: {
      _count: { select: { quotes: true, interactions: true } },
    },
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "customer").length;
  const prospects = customers.filter((c) => c.status === "prospect").length;
  const totalValue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const bySource = customers.reduce(
    (acc, c) => {
      const source = c.source || "Direct";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const interactions = await prisma.customerInteraction.findMany({
    orderBy: { createdAt: "desc" },
  });

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const thisMonthInteractions = interactions.filter(
    (i) => new Date(i.createdAt) > lastMonth
  ).length;

  return {
    totalCustomers,
    activeCustomers,
    prospects,
    totalValue,
    bySource,
    thisMonthInteractions,
  };
}

export async function getRecentCustomers(limit: number = 10) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("No autorizado");
  }

  return await prisma.customer.findMany({
    take: limit,
    orderBy: { lastInteraction: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      lastInteraction: true,
    },
  });
}
