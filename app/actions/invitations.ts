"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "moderator", "collaborator", "taller-manager"]).default("moderator"),
  isCollaborator: z.boolean().default(false),
  hourlyRate: z.number().optional(),
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
      isCollaborator: validated.isCollaborator,
      hourlyRate: validated.hourlyRate || null,
    },
  });

  // Enviar email
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;

  try {
    const { error } = await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: [validated.email],
      replyTo: "info@habitastudio.online",
      subject: `Invitación a Habita Studio - ${
        validated.role === "admin"
          ? "Administrador"
          : validated.role === "collaborator"
          ? "Colaborador"
          : validated.role === "taller-manager"
          ? "Jefe de Taller"
          : "Moderador"
      }`,
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
                      <h2 style="margin: 20px 0; font-size: 24px; color: #333;">¡Bienvenido a Habita Studio!</h2>
                      <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                        Has sido invitado a unirte a nuestro equipo como <strong>${
                          validated.role === "admin"
                            ? "Administrador"
                            : validated.role === "collaborator"
                            ? "Colaborador"
                            : validated.role === "taller-manager"
                            ? "Jefe de Taller"
                            : "Moderador"
                        }</strong>.
                      </p>
                      <p style="margin: 15px 0; color: #666; line-height: 1.6;">
                        Haz clic en el botón de abajo para completar tu registro:
                      </p>
                      <table role="presentation" style="margin: 30px 0;">
                        <tr>
                          <td class="btn-accept" bgcolor="#000000" style="background-color: #000000 !important; border-radius: 5px; padding: 0;">
                            <a href="${inviteLink}" style="background-color: #000000 !important; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                              Aceptar Invitación
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 15px 0; color: #999; font-size: 12px;">
                        Este enlace expira en 7 días.
                      </p>
                      <p style="margin: 15px 0; color: #999; font-size: 12px;">
                        Si tienes preguntas, contacta a: <strong>info@habitastudio.online</strong>
                      </p>
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

    if (error) {
      console.error("Error enviando email:", error);
      throw new Error("Error al enviar el email de invitación");
    }
  } catch (error) {
    console.error("Error en inviteUser:", error);
    throw error;
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

  // Hash password con bcrypt
  const hashedPassword = await bcrypt.hash(validated.password, 10);

  // Crear usuario
  const newUser = await prisma.user.create({
    data: {
      email: invitation.email,
      name: validated.name,
      password: hashedPassword,
      role: invitation.role,
      isCollaborator: invitation.isCollaborator,
      hourlyRate: invitation.hourlyRate || null,
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

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "moderator", "collaborator", "taller-manager"]).default("moderator"),
  isCollaborator: z.boolean().default(false),
  hourlyRate: z.number().optional(),
});

export async function createUserDirectly(data: z.infer<typeof createUserSchema>) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    throw new Error("Solo administradores pueden crear usuarios");
  }

  const validated = createUserSchema.parse(data);

  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new Error("Ya existe un usuario con este correo");
  }

  const hashedPassword = await bcrypt.hash(validated.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      password: hashedPassword,
      role: validated.role,
      isCollaborator: validated.isCollaborator,
      hourlyRate: validated.hourlyRate || null,
    },
    select: { id: true, name: true, email: true, role: true, hourlyRate: true },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/time-management");
  return newUser;
}

export async function getPendingInvitations() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
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
