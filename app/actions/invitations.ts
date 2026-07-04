"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "moderator"]).default("moderator"),
});

export async function inviteUser(data: z.infer<typeof inviteSchema>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden invitar usuarios");
  }

  const validated = inviteSchema.parse(data);

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new Error("Este usuario ya existe");
  }

  // Verificar si ya tiene una invitación activa
  const existingInvitation = await prisma.userInvitation.findFirst({
    where: {
      email: validated.email,
      accepted: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    throw new Error("Ya existe una invitación activa para este correo");
  }

  // Generar token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Válido por 7 días

  // Crear invitación
  const invitation = await prisma.userInvitation.create({
    data: {
      email: validated.email,
      role: validated.role,
      token,
      expiresAt,
    },
  });

  // Enviar email
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;

  try {
    await resend.emails.send({
      from: "noreply@habitastudio.com",
      to: validated.email,
      subject: "Invitación a Habita Studio",
      html: `
        <h2>¡Bienvenido a Habita Studio!</h2>
        <p>Has sido invitado a unirte a Habita Studio como <strong>${validated.role === "admin" ? "Administrador" : "Moderador"}</strong>.</p>
        <p>
          <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Aceptar Invitación
          </a>
        </p>
        <p>Este enlace expira en 7 días.</p>
        <p>Si tienes preguntas, contacta al administrador.</p>
      `,
    });
  } catch (error) {
    console.error("Error enviando email:", error);
    // No fallar si hay error en email, pero avisar al usuario
  }

  revalidatePath("/admin/settings/users");
  return invitation;
}

export async function acceptInvitation(
  token: string,
  password: string,
  name: string
) {
  const invitationSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    name: z.string().min(1, "El nombre es requerido"),
  });

  const validated = invitationSchema.parse({ token, password, name });

  // Buscar invitación válida
  const invitation = await prisma.userInvitation.findUnique({
    where: { token: validated.token },
  });

  if (!invitation) {
    throw new Error("Invitación no encontrada");
  }

  if (invitation.accepted) {
    throw new Error("Esta invitación ya ha sido usada");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Esta invitación ha expirado");
  }

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new Error("Este usuario ya existe");
  }

  // Hash password (usar bcrypt en producción)
  const hashedPassword = Buffer.from(validated.password).toString("base64");

  // Crear usuario
  const newUser = await prisma.user.create({
    data: {
      email: invitation.email,
      name: validated.name,
      password: hashedPassword,
      role: invitation.role,
    },
  });

  // Marcar invitación como aceptada
  await prisma.userInvitation.update({
    where: { id: invitation.id },
    data: { accepted: true },
  });

  revalidatePath("/admin");
  return newUser;
}

export async function getPendingInvitations() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden ver invitaciones");
  }

  return await prisma.userInvitation.findMany({
    where: { accepted: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteInvitation(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden eliminar invitaciones");
  }

  await prisma.userInvitation.delete({
    where: { id },
  });

  revalidatePath("/admin/settings/users");
}
