"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Resend } from "resend";
import { generateReceiptPDFBuffer } from "@/lib/generate-receipt-pdf-server";

const resend = new Resend(process.env.RESEND_API_KEY);

const receiptSchema = z.object({
  id: z.string().optional(),
  quoteId: z.string().min(1, "Debe seleccionar una cotización"),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientEmail: z
    .preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return null;
        return val;
      },
      z.union([z.string().email("Email inválido"), z.null()]).optional()
    ),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentMethod: z.enum(["efectivo", "transferencia", "sinpe", "cheque", "otro"]),
  receiptDate: z.string().min(1, "La fecha del recibo es requerida"),
  concept: z.string().min(1, "El concepto es requerido"),
  notes: z.string().optional().nullable(),
});

export async function createUpdateReceipt(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const data = Object.fromEntries(formData);
    
    // Parsear datos del formulario
    const receiptData = {
      id: data.id as string | undefined,
      quoteId: data.quoteId as string,
      clientName: data.clientName as string,
      clientEmail: data.clientEmail as string | undefined,
      amount: parseFloat(data.amount as string),
      paymentMethod: data.paymentMethod as "efectivo" | "transferencia" | "sinpe" | "cheque" | "otro",
      receiptDate: data.receiptDate as string,
      concept: data.concept as string,
      notes: (data.notes as string) || null,
    };

    // Validar con Zod
    const validated = receiptSchema.parse(receiptData);

    // Obtener la cotización para validar el monto
    const quote = await prisma.quote.findUnique({
      where: { id: validated.quoteId },
      include: { receipts: true },
    });

    if (!quote) {
      return { ok: false, message: "Cotización no encontrada" };
    }

    // Calcular el monto total ya pagado (suma de todos los recibos excepto el actual si está editando)
    const existingReceipts = quote.receipts.filter(
      (r) => !validated.id || r.id !== validated.id
    );
    const totalPaid = existingReceipts.reduce((sum, r) => sum + r.amount, 0);
    const availableAmount = quote.total - totalPaid;

    // Validar que el monto no sea mayor al disponible
    if (validated.amount > availableAmount) {
      return {
        ok: false,
        message: `El monto no puede ser mayor al disponible (${availableAmount.toLocaleString("es-CR", {
          style: "currency",
          currency: "CRC",
        })})`,
      };
    }

    // Preparar datos para Prisma
    const prismaData: any = {
      quoteId: validated.quoteId,
      clientName: validated.clientName,
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      receiptDate: new Date(validated.receiptDate),
      concept: validated.concept,
      notes: validated.notes || undefined,
    };

    // Si tiene email, agregarlo (solo si no es null/undefined/vacío)
    if (validated.clientEmail) {
      prismaData.clientEmail = validated.clientEmail;
    }

    let result;

    // Crear o actualizar el recibo
    if (validated.id) {
      // Actualizar recibo existente
      result = await prisma.receipt.update({
        where: { id: validated.id },
        data: prismaData,
        include: { quote: true },
      });
    } else {
      // Crear nuevo recibo - generar número de recibo
      const currentYear = new Date().getFullYear();
      
      // Buscar o crear secuencia para el año actual
      let sequence = await prisma.receiptSequence.findUnique({
        where: { year: currentYear },
      });

      if (!sequence) {
        sequence = await prisma.receiptSequence.create({
          data: { year: currentYear, lastNumber: 0 },
        });
      }

      // Obtener el último número de recibo del año
      const lastReceipt = await prisma.receipt.findFirst({
        where: {
          receiptNumber: {
            startsWith: `REC-${currentYear}-`,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextNumber = sequence.lastNumber + 1;
      if (lastReceipt) {
        const lastNumber = parseInt(
          lastReceipt.receiptNumber.split("-").pop() || "0",
          10
        );
        if (lastNumber >= nextNumber) {
          nextNumber = lastNumber + 1;
        }
      }

      const padded = String(nextNumber).padStart(4, "0");
      const receiptNumber = `REC-${currentYear}-${padded}`;

      // Actualizar secuencia
      await prisma.receiptSequence.update({
        where: { year: currentYear },
        data: { lastNumber: nextNumber },
      });

      result = await prisma.receipt.create({
        data: {
          ...prismaData,
          receiptNumber,
        },
        include: { quote: true },
      });
    }

    revalidatePath("/admin/receipts");
    revalidatePath(`/admin/receipts/${result?.id}`);

    return {
      ok: true,
      receipt: result,
      message: validated.id ? "Recibo actualizado" : "Recibo creado",
    };
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        message: "Error de validación: " + error.errors.map((e) => e.message).join(", "),
      };
    }
    return {
      ok: false,
      message: "Error al guardar el recibo: " + (error as Error).message,
    };
  }
}

export async function deleteReceipt(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.receipt.delete({
    where: { id },
  });

  revalidatePath("/admin/receipts");
}

export async function getReceipts() {
  return await prisma.receipt.findMany({
    include: {
      quote: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Función helper para calcular el saldo pendiente de una cotización
// Calcula el saldo DESPUÉS de aplicar el recibo actual
async function calculateBalance(quoteId: string, receiptId: string, receiptAmount: number): Promise<number> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      receipts: true,
    },
  });

  if (!quote) return 0;

  // Sumar todos los recibos excepto el actual
  const totalPaidOtherReceipts = quote.receipts
    .filter((r) => r.id !== receiptId)
    .reduce((sum, r) => sum + r.amount, 0);

  // El saldo es: total de cotización - recibos anteriores - este recibo
  return Math.max(0, quote.total - totalPaidOtherReceipts - receiptAmount);
}

export async function getReceipt(id: string) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      quote: {
        include: {
          receipts: true,
        },
      },
    },
  });

  if (!receipt) return null;

  // Calcular saldo pendiente después de aplicar este recibo
  const balance = await calculateBalance(receipt.quoteId, receipt.id, receipt.amount);

  return {
    ...receipt,
    balance,
  };
}

export async function getReceiptsByQuote(quoteId: string) {
  return await prisma.receipt.findMany({
    where: { quoteId },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendReceipt(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        quote: true,
      },
    });

    if (!receipt) {
      return { ok: false, message: "Recibo no encontrado" };
    }

    // Verificar que el email del cliente existe
    if (!receipt.clientEmail) {
      return { ok: false, message: "El cliente no tiene un email registrado" };
    }

    // Calcular saldo pendiente después de aplicar este recibo
    const balance = await calculateBalance(receipt.quoteId, receipt.id, receipt.amount);

    // Generar PDF
    const pdfBuffer = await generateReceiptPDFBuffer({
      receiptNumber: receipt.receiptNumber,
      clientName: receipt.clientName,
      clientEmail: receipt.clientEmail,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      receiptDate: receipt.receiptDate,
      concept: receipt.concept,
      notes: receipt.notes,
      quoteNumber: receipt.quote.quoteNumber,
      quoteTotal: receipt.quote.total,
      balance,
      createdAt: receipt.createdAt,
    });

    // Convertir buffer a base64
    const pdfBase64 = pdfBuffer.toString("base64");

    // Preparar URL de WhatsApp para el botón del correo
    const companyWhatsappNumber = "50663644915";
    const whatsappMessageEmail = `Hola, tengo una pregunta sobre el recibo ${receipt.receiptNumber}.`;
    const whatsappUrlEmail = `https://wa.me/${companyWhatsappNumber}?text=${encodeURIComponent(
      whatsappMessageEmail
    )}`;

    // Enviar email con PDF adjunto
    const { data, error } = await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: [receipt.clientEmail],
      replyTo: "info@habitastudio.online",
      subject: `Recibo ${receipt.receiptNumber} - Habita Studio`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://habitastudio.online/images/logo.png" alt="Habita Studio" style="max-width: 200px; height: auto;">
          </div>
          <h1 style="color: #2c3e50;">Recibo ${receipt.receiptNumber}</h1>
          <p>Estimado/a ${receipt.clientName},</p>
          <p>Adjuntamos el recibo de pago correspondiente a la cotización ${receipt.quote.quoteNumber}.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Monto:</strong> ₡${receipt.amount.toLocaleString("es-CR")}</p>
            <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${receipt.paymentMethod}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date(receipt.receiptDate).toLocaleDateString("es-CR")}</p>
          </div>
          <p>Si tiene alguna pregunta o necesita más información, no dude en contactarnos.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${whatsappUrlEmail}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Contáctenos por WhatsApp</a>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">Este es un correo automático, por favor no responda a este mensaje.</p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Recibo-${receipt.receiptNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Error al enviar email:", error);
      return { ok: false, message: "Error al enviar el email: " + error.message };
    }

    // Actualizar fecha de envío
    await prisma.receipt.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    revalidatePath("/admin/receipts");
    revalidatePath(`/admin/receipts/${id}`);

    // Preparar datos para WhatsApp
    const whatsappMessage = `Hola ${receipt.clientName}, te envío el recibo de pago ${receipt.receiptNumber} correspondiente a la cotización ${receipt.quote.quoteNumber}.

Monto: ${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(receipt.amount)}
Método de pago: ${receipt.paymentMethod}
Fecha: ${new Date(receipt.receiptDate).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}

Adjunto encontrarás el PDF con todos los detalles. Si tienes alguna pregunta, no dudes en contactarnos.

¡Saludos!
Habita Studio`;

    // Obtener teléfono del cliente desde la cotización
    const quote = await prisma.quote.findUnique({
      where: { id: receipt.quoteId },
      select: { clientPhone: true },
    });

    // Formatear teléfono para WhatsApp (eliminar espacios y caracteres especiales, asegurar prefijo +506)
    let whatsappNumber = '';
    if (quote?.clientPhone) {
      // Eliminar todos los caracteres no numéricos
      const cleanPhone = quote.clientPhone.replace(/\D/g, '');
      
      // Si empieza con 506, usar tal cual
      if (cleanPhone.startsWith('506')) {
        whatsappNumber = cleanPhone;
      } 
      // Si tiene 8 dígitos, agregar 506 (formato Costa Rica)
      else if (cleanPhone.length === 8) {
        whatsappNumber = `506${cleanPhone}`;
      }
      // Si tiene más de 8 dígitos, tomar los últimos 8 y agregar 506
      else if (cleanPhone.length > 8) {
        whatsappNumber = `506${cleanPhone.slice(-8)}`;
      }
      // Si tiene menos de 8, agregar 506
      else {
        whatsappNumber = `506${cleanPhone}`;
      }
    }
    
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
      : null;

    return {
      ok: true,
      message: whatsappUrl 
        ? "Recibo enviado por email. Abriendo WhatsApp..." 
        : "Recibo enviado por email correctamente",
      whatsappUrl: whatsappUrl || undefined,
      pdfBase64,
      receiptNumber: receipt.receiptNumber,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      ok: false,
      message: "Error al enviar el recibo: " + (error as Error).message,
    };
  }
}
