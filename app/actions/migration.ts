"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function migrateAcceptedQuotesToCustomers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { success: false as const, message: "Solo administradores pueden ejecutar migraciones" };
  }

  try {
    // Obtener todas las cotizaciones aceptadas sin cliente asociado
    const acceptedQuotes = await prisma.quote.findMany({
      where: {
        status: "accepted",
        customerId: null,
      },
    });

    console.log(`Encontradas ${acceptedQuotes.length} cotizaciones aceptadas para migrar`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const quote of acceptedQuotes) {
      // Verificar si ya existe cliente con ese email
      let customer = null;

      if (quote.clientEmail) {
        customer = await prisma.customer.findUnique({
          where: { email: quote.clientEmail },
        });
      }

      // Si no existe, crear nuevo cliente
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: quote.clientName,
            email: quote.clientEmail || `customer-${quote.id}@habitastudio.local`,
            phone: quote.clientPhone || undefined,
            address: quote.clientAddress || undefined,
            status: "customer",
            source: "converted_from_quote",
            totalSpent: quote.total,
          },
        });
        createdCount++;
      } else {
        // Actualizar cliente existente
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: {
              increment: quote.total,
            },
            status: "customer",
          },
        });
      }

      // Asociar cotización al cliente
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          customerId: customer.id,
        },
      });

      updatedCount++;
    }

    revalidatePath("/admin/crm");
    revalidatePath("/admin/quotes");

    return {
      success: true as const,
      message: `Migración completada: ${createdCount} nuevos clientes creados, ${updatedCount} cotizaciones asociadas`,
      stats: {
        total: acceptedQuotes.length,
        created: createdCount,
        updated: updatedCount,
      },
    };
  } catch (error: any) {
    console.error("Error en migración:", error);
    return { success: false as const, message: `Error en migración: ${error.message}` };
  }
}

export async function enableAutoConversionOnAcceptance() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Solo administradores pueden hacer esto");
  }

  console.log("La conversión automática está habilitada en updateQuoteStatus");
  return {
    success: true,
    message: "Las cotizaciones aceptadas se convertirán automáticamente en clientes",
  };
}
