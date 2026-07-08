"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSectionAccess } from "@/app/actions/role-permissions";

async function requireInventoryAccess() {
  const { user, allowed } = await getSectionAccess("admin.inventory");
  if (!user || !allowed) {
    throw new Error("No autorizado para gestionar el inventario");
  }
  return user;
}

// ============ MATERIALES ============

export async function getMaterials() {
  await requireInventoryAccess();

  return await prisma.material.findMany({
    include: {
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getMaterialsForSelect() {
  await requireInventoryAccess();

  return await prisma.material.findMany({
    select: { id: true, name: true, unit: true, costPerUnit: true, quantity: true },
    orderBy: { name: "asc" },
  });
}

export async function getMaterial(id: string) {
  await requireInventoryAccess();

  return await prisma.material.findUnique({
    where: { id },
    include: {
      supplier: true,
      movements: {
        include: { creator: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createMaterial(data: {
  name: string;
  unit: string;
  costPerUnit: number;
  quantity: number;
  minimumStock: number;
  supplierId?: string;
  notes?: string;
}) {
  const user = await requireInventoryAccess();

  const material = await prisma.material.create({
    data: {
      name: data.name,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      quantity: data.quantity,
      minimumStock: data.minimumStock,
      supplierId: data.supplierId || null,
      notes: data.notes || null,
    },
  });

  if (data.quantity > 0) {
    await prisma.materialMovement.create({
      data: {
        materialId: material.id,
        type: "in",
        quantity: data.quantity,
        reference: "Stock inicial",
        createdBy: user.id,
      },
    });
  }

  revalidatePath("/admin/inventory");
  return material;
}

export async function updateMaterial(
  id: string,
  data: {
    name: string;
    unit: string;
    costPerUnit: number;
    minimumStock: number;
    supplierId?: string;
    notes?: string;
  }
) {
  await requireInventoryAccess();

  const material = await prisma.material.update({
    where: { id },
    data: {
      name: data.name,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      minimumStock: data.minimumStock,
      supplierId: data.supplierId || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
  return material;
}

export async function deleteMaterial(id: string) {
  await requireInventoryAccess();

  await prisma.material.delete({ where: { id } });

  revalidatePath("/admin/inventory");
}

export async function adjustMaterialStock(
  materialId: string,
  input: { type: "in" | "out"; quantity: number; notes?: string }
) {
  const user = await requireInventoryAccess();

  if (input.quantity <= 0) {
    throw new Error("La cantidad debe ser mayor a cero");
  }

  return await prisma.$transaction(async (tx) => {
    const material = await tx.material.findUnique({ where: { id: materialId } });
    if (!material) throw new Error("Material no encontrado");

    if (input.type === "out" && material.quantity < input.quantity) {
      throw new Error(`Stock insuficiente (disponible: ${material.quantity} ${material.unit})`);
    }

    const updated = await tx.material.update({
      where: { id: materialId },
      data: {
        quantity:
          input.type === "in"
            ? { increment: input.quantity }
            : { decrement: input.quantity },
      },
    });

    await tx.materialMovement.create({
      data: {
        materialId,
        type: input.type,
        quantity: input.quantity,
        reference: "Ajuste manual",
        notes: input.notes || null,
        createdBy: user.id,
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${materialId}`);
    return updated;
  });
}

// ============ PROVEEDORES ============

export async function getSuppliers() {
  await requireInventoryAccess();

  return await prisma.supplier.findMany({
    include: { _count: { select: { materials: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createSupplier(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  paymentTerms?: string;
}) {
  await requireInventoryAccess();

  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      paymentTerms: data.paymentTerms || null,
    },
  });

  revalidatePath("/admin/inventory/suppliers");
  return supplier;
}

export async function updateSupplier(
  id: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    paymentTerms?: string;
    isActive?: boolean;
  }
) {
  await requireInventoryAccess();

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      paymentTerms: data.paymentTerms || null,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath("/admin/inventory/suppliers");
  return supplier;
}

export async function deleteSupplier(id: string) {
  await requireInventoryAccess();

  await prisma.supplier.delete({ where: { id } });

  revalidatePath("/admin/inventory/suppliers");
}
