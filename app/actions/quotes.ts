"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  clientEmail: z.string().email("Email inválido"),
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
  items: z.array(quoteItemSchema).min(1, "Debe agregar al menos un item"),
});

function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `COT-${year}-${random}`;
}

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

    // Limpiar campos opcionales vacíos
    const cleanData = {
      ...data,
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
    const { id, items: quoteItems, validUntil: validUntilStr, ...quoteFields } = quote;

    // Convertir validUntil de string a Date o null
    const validUntilDate = validUntilStr && validUntilStr.trim() 
      ? new Date(validUntilStr) 
      : null;

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
          data: {
            ...quoteFields,
            validUntil: validUntilDate,
          },
        });
      } else {
        // CREAR
        const quoteNumber = generateQuoteNumber();
        dbQuote = await tx.quote.create({
          data: {
            ...quoteFields,
            quoteNumber,
            validUntil: validUntilDate,
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

    // Aquí puedes agregar lógica para enviar el email
    // Por ahora solo actualizamos el estado
    await prisma.quote.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${id}`);

    return {
      ok: true,
      message: "Cotización enviada correctamente",
    };
  } catch (error) {
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

