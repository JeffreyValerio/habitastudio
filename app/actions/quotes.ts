"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadImages as uploadMany } from "@/lib/cloudinary";
import { Resend } from "resend";
import { generateQuotePDFBuffer } from "@/lib/generate-pdf-server";

const resend = new Resend(process.env.RESEND_API_KEY);

const quoteItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const quoteSchema = z.object({
  id: z.string().optional(),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientEmail: z
    .preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return null;
        return val;
      },
      z.union([z.string().email("Email inválido"), z.null()]).optional()
    ),
  clientPhone: z.string().optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  projectName: z.string().min(1, "El nombre del proyecto es requerido"),
  projectDescription: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  validUntil: z.string().optional().nullable(),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  notes: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  items: z.array(quoteItemSchema).min(1, "Debe agregar al menos un item"),
});

// Eliminado generador aleatorio; ahora usamos secuencia en DB

export async function createUpdateQuote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const data = Object.fromEntries(formData);
    
    // Parsear items desde JSON string
    let items = [];
    if (data.items) {
      try {
        items = JSON.parse(data.items as string);
      } catch (e) {
        return { ok: false, message: "Error al parsear items" };
      }
    }

    // Manejo de imágenes (igual que productos/proyectos)
    let images: string[] = [];
    const files = formData.getAll("images") as File[]; // múltiples archivos nuevos
    const directUrls = formData.getAll("imageUrls") as string[]; // múltiples URLs existentes

    // Priorizar el JSON del formulario que ya tiene las eliminaciones aplicadas
    const galleryForm = formData.get("gallery") as string | null;
    if (galleryForm) {
      try {
        const parsed = JSON.parse(galleryForm);
        if (Array.isArray(parsed)) {
          images = parsed.filter((u) => typeof u === "string" && u.trim() !== "");
        }
      } catch (_e) {
        // ignore parse error
      }
    }
    
    // Si no hay JSON, usar imageUrls como fallback (compatibilidad)
    if (images.length === 0 && directUrls && directUrls.length > 0) {
      images = [...directUrls];
    }

    // Agregar archivos nuevos subidos
    if (files && files.length > 0) {
      try {
        const uploaded = await uploadMany(files, "habita-studio/quotes");
        images = [...images, ...uploaded];
      } catch (error) {
        console.error("Error al subir imágenes:", error);
        // Continuar con el proceso aunque algunas imágenes fallen
      }
    }

    // Limpiar campos opcionales vacíos
    const cleanData = {
      ...data,
      clientEmail: data.clientEmail && typeof data.clientEmail === 'string' && data.clientEmail.trim() 
        ? data.clientEmail.trim() 
        : null,
      clientPhone: (data.clientPhone as string)?.trim() || null,
      clientAddress: (data.clientAddress as string)?.trim() || null,
      projectDescription: (data.projectDescription as string)?.trim() || null,
      validUntil: (data.validUntil as string)?.trim() || null,
      notes: (data.notes as string)?.trim() || null,
    };

    const quoteData = {
      ...cleanData,
      subtotal: parseFloat(data.subtotal as string) || 0,
      tax: parseFloat(data.tax as string) || 0,
      discount: parseFloat(data.discount as string) || 0,
      total: parseFloat(data.total as string) || 0,
      items,
      images,
    };

    const parsedData = quoteSchema.safeParse(quoteData);

    if (!parsedData.success) {
      console.error("Validation errors:", parsedData.error.errors);
      return {
        ok: false,
        message: "Error de validación: " + parsedData.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
        errors: parsedData.error.errors,
      };
    }

    const quote = parsedData.data;
    const { id, items: quoteItems, validUntil: validUntilStr, images: quoteImages, ...quoteFields } = quote;

    // Convertir validUntil de string a Date o null
    const validUntilDate = validUntilStr && validUntilStr.trim() 
      ? new Date(validUntilStr) 
      : null;

    // Construir objeto de datos para Prisma, manejando campos opcionales null
    // Para campos opcionales, si son null/undefined, los omitimos del objeto
    const prismaData: any = {
      clientName: quoteFields.clientName,
      projectName: quoteFields.projectName,
      status: quoteFields.status,
      subtotal: quoteFields.subtotal,
      tax: quoteFields.tax,
      discount: quoteFields.discount,
      total: quoteFields.total,
      validUntil: validUntilDate,
      images: quoteImages || [],
    };

    // Agregar campos opcionales
    // Para campos opcionales: incluir solo si tienen un valor válido (no string vacío)
    // Si es null o undefined, simplemente no lo incluimos (Prisma usará null por defecto para campos opcionales)
    if (quoteFields.clientEmail !== undefined && quoteFields.clientEmail !== null && quoteFields.clientEmail !== "") {
      prismaData.clientEmail = quoteFields.clientEmail;
    }
    if (quoteFields.clientPhone !== undefined && quoteFields.clientPhone !== null && quoteFields.clientPhone !== "") {
      prismaData.clientPhone = quoteFields.clientPhone;
    }
    if (quoteFields.clientAddress !== undefined && quoteFields.clientAddress !== null && quoteFields.clientAddress !== "") {
      prismaData.clientAddress = quoteFields.clientAddress;
    }
    if (quoteFields.projectDescription !== undefined && quoteFields.projectDescription !== null && quoteFields.projectDescription !== "") {
      prismaData.projectDescription = quoteFields.projectDescription;
    }
    if (quoteFields.notes !== undefined && quoteFields.notes !== null && quoteFields.notes !== "") {
      prismaData.notes = quoteFields.notes;
    }

    const result = await prisma.$transaction(async (tx) => {
      let dbQuote;

      if (id) {
        // ACTUALIZAR
        // Eliminar items existentes
        await tx.quoteItem.deleteMany({
          where: { quoteId: id },
        });

        // Actualizar cotización
        dbQuote = await tx.quote.update({
          where: { id },
          data: prismaData,
        });
      } else {
        // CREAR
        const currentYear = new Date().getFullYear();
        // Obtener el último número usado este año y calcular el siguiente
        const lastOfYear = await tx.quote.findFirst({
          where: { quoteNumber: { startsWith: `COT-${currentYear}-` } },
          orderBy: { createdAt: "desc" },
          select: { quoteNumber: true },
        });
        const lastNumber = lastOfYear
          ? parseInt((lastOfYear.quoteNumber.split("-").pop() || "0"), 10) || 0
          : 0;
        const nextNumber = lastNumber + 1;
        const padded = String(nextNumber).padStart(4, "0");
        const quoteNumber = `COT-${currentYear}-${padded}`;
        dbQuote = await tx.quote.create({
          data: {
            ...prismaData,
            quoteNumber,
          },
        });
      }

      // Crear items
      for (const item of quoteItems) {
        await tx.quoteItem.create({
          data: {
            quoteId: dbQuote.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
        });
      }

      return await tx.quote.findUnique({
        where: { id: dbQuote.id },
        include: { items: true },
      });
    });

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${result?.id}`);

    return {
      ok: true,
      quote: result,
      message: id ? "Cotización actualizada" : "Cotización creada",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      ok: false,
      message: "Error al guardar la cotización: " + (error as Error).message,
    };
  }
}

export async function deleteQuote(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.quote.delete({
    where: { id },
  });

  revalidatePath("/admin/quotes");
}

export async function getQuotes() {
  return await prisma.quote.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuote(id: string) {
  return await prisma.quote.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });
}

export async function sendQuote(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      return { ok: false, message: "Cotización no encontrada" };
    }

    // Si la cotización no tiene fecha de vencimiento, establecerla a 15 días desde hoy
    let validUntilDate = quote.validUntil;
    if (!validUntilDate) {
      const today = new Date();
      const validUntil = new Date(today);
      validUntil.setDate(today.getDate() + 15);
      validUntilDate = validUntil;
      
      // Actualizar la cotización con la fecha de vencimiento
      await prisma.quote.update({
        where: { id },
        data: {
          validUntil: validUntilDate,
        },
      });
    }

    // Generar PDF
    const pdfBuffer = await generateQuotePDFBuffer({
      quoteNumber: quote.quoteNumber,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      projectName: quote.projectName,
      projectDescription: quote.projectDescription,
      status: quote.status,
      validUntil: validUntilDate,
      subtotal: quote.subtotal,
      tax: quote.tax,
      discount: quote.discount,
      total: quote.total,
      notes: quote.notes,
      images: (quote.images as string[]) || [],
      items: quote.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      createdAt: quote.createdAt,
    });

    // Convertir buffer a base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Verificar que el email del cliente existe
    if (!quote.clientEmail) {
      return { ok: false, message: "El cliente no tiene un email registrado" };
    }

    // Preparar URL de WhatsApp para el botón del correo
    const companyWhatsappNumber = "50663644915";
    const whatsappMessageEmail = `Hola, tengo una pregunta sobre la cotización ${quote.quoteNumber}.`;
    const whatsappUrlEmail = `https://wa.me/${companyWhatsappNumber}?text=${encodeURIComponent(whatsappMessageEmail)}`;

    // Enviar email con PDF adjunto
    const { data, error } = await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: [quote.clientEmail],
      replyTo: "info@habitastudio.online",
      subject: `Cotización ${quote.quoteNumber} - Habita Studio`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                    <td style="background-color: #4f46e5; padding: 30px 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        Cotización ${quote.quoteNumber}
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Estimado/a <strong>${quote.clientName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Adjunto encontrará la cotización <strong>${quote.quoteNumber}</strong> para su proyecto <strong>"${quote.projectName}"</strong>.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Esta cotización tiene un valor total de <strong style="color: #4f46e5;">${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(quote.total)}</strong>.
                      </p>
                      ${validUntilDate ? `
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Esta cotización es válida hasta el <strong>${new Date(validUntilDate).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
                      </p>
                      ` : ''}
                      <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Si tiene alguna pregunta o necesita más información, no dude en contactarnos.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${whatsappUrlEmail}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                          Contactarnos por WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                        <strong style="color: #4f46e5;">Habita Studio</strong><br>
                        Muebles y Remodelaciones de Calidad<br>
                        Email: info@habitastudio.online | Tel: +506 6364 4915
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
      attachments: [
        {
          filename: `cotizacion-${quote.quoteNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Error de Resend:", error);
      return {
        ok: false,
        message: "Error al enviar el email: " + (error as any).message,
      };
    }

    // Actualizar estado de la cotización
    await prisma.quote.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${id}`);

    // Preparar datos para WhatsApp
    const whatsappMessage = `Hola ${quote.clientName}, te envío la cotización ${quote.quoteNumber} para tu proyecto "${quote.projectName}".

Total: ${new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(quote.total)}
${validUntilDate ? `Válida hasta: ${new Date(validUntilDate).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

Adjunto encontrarás el PDF con todos los detalles. Si tienes alguna pregunta, no dudes en contactarnos.

¡Saludos!
Habita Studio`;

    // Formatear teléfono para WhatsApp (eliminar espacios y caracteres especiales, asegurar prefijo +506)
    let whatsappNumber = '';
    if (quote.clientPhone) {
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
        ? "Cotización enviada por email. Abriendo WhatsApp..." 
        : "Cotización enviada por email correctamente",
      whatsappUrl: whatsappUrl || undefined,
      pdfBase64,
      quoteNumber: quote.quoteNumber,
    };
  } catch (error) {
    console.error("Error enviando cotización:", error);
    return {
      ok: false,
      message: "Error al enviar la cotización: " + (error as Error).message,
    };
  }
}

export async function updateQuoteStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    await prisma.quote.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${id}`);

    return { ok: true, message: "Estado actualizado" };
  } catch (error) {
    return {
      ok: false,
      message: "Error al actualizar el estado: " + (error as Error).message,
    };
  }
}

