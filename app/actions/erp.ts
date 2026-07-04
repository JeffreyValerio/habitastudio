"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ SUPPLIERS ============

export async function getSuppliers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver proveedores");
  }

  return await prisma.supplier.findMany({
    include: {
      _count: { select: { purchaseOrders: true, products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSupplier(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden crear proveedores");
  }

  const supplier = await prisma.supplier.create({
    data,
  });

  revalidatePath("/admin/erp/suppliers");
  return supplier;
}

export async function updateSupplier(id: string, data: any) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden editar proveedores");
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/erp/suppliers");
  return supplier;
}

export async function deleteSupplier(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar proveedores");
  }

  await prisma.supplier.delete({
    where: { id },
  });

  revalidatePath("/admin/erp/suppliers");
}

// ============ PURCHASE ORDERS ============

export async function getPurchaseOrders() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver órdenes de compra");
  }

  return await prisma.purchaseOrder.findMany({
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  items: Array<{ productId: string; quantity: number; costPrice: number }>;
  expectedDate?: Date;
  notes?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden crear órdenes de compra");
  }

  // Generate PO number
  const today = new Date();
  const year = today.getFullYear();
  const poCount = await prisma.purchaseOrder.count({
    where: {
      orderDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });

  const poNumber = `PO-${year}-${String(poCount + 1).padStart(5, "0")}`;

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
  const tax = subtotal * 0.13; // 13% IVA
  const total = subtotal + tax;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      expectedDate: data.expectedDate,
      notes: data.notes,
      subtotal,
      tax,
      total,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.costPrice,
          total: item.costPrice * item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  revalidatePath("/admin/erp/purchase-orders");
  return po;
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden actualizar órdenes");
  }

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      receivedDate: status === "received" ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/erp/purchase-orders");
  return po;
}

// ============ INVENTORY ============

export async function getInventory() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver inventario");
  }

  return await prisma.productStock.findMany({
    include: {
      product: { select: { id: true, name: true, price: true, cost: true } },
    },
    orderBy: { product: { name: "asc" } },
  });
}

export async function getInventoryMovements(productId?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver movimientos");
  }

  return await prisma.inventoryMovement.findMany({
    where: productId ? { productId } : {},
    include: {
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addInventoryMovement(data: {
  productId: string;
  type: "in" | "out" | "adjustment" | "transfer";
  quantity: number;
  reference?: string;
  notes?: string;
  poId?: string;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden registrar movimientos");
  }

  const movement = await prisma.inventoryMovement.create({
    data,
  });

  // Update stock
  const product = await prisma.productStock.findUnique({
    where: { productId: data.productId },
  });

  if (product) {
    let newQuantity = product.quantity;
    if (data.type === "in") newQuantity += data.quantity;
    else if (data.type === "out") newQuantity -= data.quantity;
    else if (data.type === "adjustment") newQuantity = data.quantity;

    await prisma.productStock.update({
      where: { productId: data.productId },
      data: {
        quantity: Math.max(0, newQuantity),
        lastMovementDate: new Date(),
      },
    });
  }

  revalidatePath("/admin/erp/inventory");
  return movement;
}

// ============ ERP ANALYTICS ============

export async function getERPAnalytics() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver analíticas");
  }

  const [suppliers, pos, stock, movements] = await Promise.all([
    prisma.supplier.count(),
    prisma.purchaseOrder.findMany({ select: { total: true, status: true } }),
    prisma.productStock.findMany({ select: { quantity: true, product: { select: { cost: true } } } }),
    prisma.inventoryMovement.findMany({ select: { type: true, quantity: true, createdAt: true } }),
  ]);

  const totalSuppliers = suppliers;
  const activePOs = pos.filter((p) => p.status === "draft" || p.status === "sent").length;
  const totalPOValue = pos.reduce((sum, p) => sum + p.total, 0);
  const stockValue = stock.reduce((sum, s) => sum + (s.quantity * s.product.cost), 0);

  const thisMonthMovements = movements.filter(
    (m) => new Date(m.createdAt) > new Date(new Date().setMonth(new Date().getMonth() - 1))
  ).length;

  return {
    totalSuppliers,
    activePOs,
    totalPOValue,
    stockValue,
    thisMonthMovements,
    totalProducts: stock.length,
  };
}
