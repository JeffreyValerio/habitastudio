import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
        console.log(`Nuevo cliente creado: ${customer.name} (${customer.email})`);
      } else {
        // Actualizar cliente existente - agregar valor de la cotización
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: {
              increment: quote.total,
            },
            status: "customer",
            lastInteraction: new Date(), // Actualizar última interacción
          },
        });
        updatedCount++;
        console.log(`Cliente actualizado: ${customer.name} (${customer.email}) - Agregado: ₡${quote.total}`);
      }

      // Asociar cotización al cliente
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          customerId: customer.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Migración completada: ${createdCount} nuevos clientes creados, ${updatedCount} cotizaciones asociadas a clientes existentes`,
      stats: {
        total: acceptedQuotes.length,
        created: createdCount,
        updated: updatedCount,
      },
    });
  } catch (error: any) {
    console.error("Error en migración:", error);
    return NextResponse.json(
      { error: `Error en migración: ${error.message}` },
      { status: 500 }
    );
  }
}
