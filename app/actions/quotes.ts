"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadImages as uploadMany } from "@/lib/cloudinary";

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
            images: quoteImages || [],
          } as any,
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
            ...quoteFields,
            quoteNumber,
            validUntil: validUntilDate,
            images: quoteImages || [],
          } as any,
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

