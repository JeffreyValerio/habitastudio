"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSectionAccess } from "@/app/actions/role-permissions";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden gestionar usuarios");
  }
  return user;
}

export async function getUsers() {
  const { allowed } = await getSectionAccess("admin.settings.users");
  if (!allowed) {
    throw new Error("No autorizado para ver usuarios");
  }

  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isCollaborator: true,
      hourlyRate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(id: string) {
  await requireAdmin();

  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isCollaborator: true,
      hourlyRate: true,
      createdAt: true,
    },
  });
}

const updateUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "moderator", "collaborator", "taller-manager"]),
  hourlyRate: z.number().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
});

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  await requireAdmin();

  const validated = updateUserSchema.parse(data);

  const existing = await prisma.user.findUnique({ where: { email: validated.email } });
  if (existing && existing.id !== id) {
    throw new Error("Ya existe otro usuario con ese correo");
  }

  const isCollaborator = validated.role === "collaborator" || validated.role === "taller-manager";

  const updateData: {
    name: string;
    email: string;
    role: string;
    isCollaborator: boolean;
    hourlyRate: number | null;
    password?: string;
  } = {
    name: validated.name,
    email: validated.email,
    role: validated.role,
    isCollaborator,
    hourlyRate: isCollaborator ? validated.hourlyRate ?? null : null,
  };

  if (validated.password) {
    updateData.password = await bcrypt.hash(validated.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  revalidatePath("/admin/settings/users");
  return user;
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();

  if (admin.id === id) {
    throw new Error("No puedes eliminar tu propia cuenta");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw new Error("Usuario no encontrado");
  }

  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new Error("No puedes eliminar al único administrador");
    }
  }

  // Evitar que se borren en cascada registros de negocio (horas, gastos,
  // movimientos de inventario) que dependen de este usuario.
  const [timeEntries, expenses, movements, payrolls] = await Promise.all([
    prisma.timeEntry.count({ where: { userId: id } }),
    prisma.workOrderExpense.count({ where: { createdBy: id } }),
    prisma.materialMovement.count({ where: { createdBy: id } }),
    prisma.payroll.count({ where: { userId: id } }),
  ]);

  const hasHistory =
    timeEntries > 0 || expenses > 0 || movements > 0 || payrolls > 0;

  if (hasHistory) {
    throw new Error(
      "Este usuario tiene historial asociado (horas, gastos u otros registros) y no se puede eliminar sin perder esos registros. Cambia su rol en su lugar si ya no debe tener acceso."
    );
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/admin/settings/users");
}
