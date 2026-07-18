"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSectionAccess } from "@/app/actions/role-permissions";
import { revalidatePath } from "next/cache";
import { buildConsecutivo, buildClaveNumerica, fechaEmisionCR } from "@/lib/hacienda/clave";
import { buildFacturaXML, type LineaDetalleXmlData } from "@/lib/hacienda/xml";
import { signXAdES } from "@/lib/hacienda/sign";
import { submitDocument, queryStatus, readP12Base64, getP12Pin } from "@/lib/hacienda/api";
import { isCabysMercancia } from "@/lib/hacienda/cabys";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function getEmisorConfig() {
  return prisma.emisorConfig.findFirst();
}

export async function saveEmisorConfig(data: {
  nombre: string;
  nombreComercial?: string;
  identificacionTipo: string;
  identificacionNumero: string;
  actividadEconomica: string;
  provincia: string;
  canton: string;
  distrito: string;
  barrio?: string;
  otrasSenas: string;
  telefonoCodigoPais: string;
  telefono: string;
  correoElectronico: string;
}) {
  const user = await requireAdmin();
  if (!user) {
    return { ok: false as const, message: "Solo administradores pueden editar los datos del emisor" };
  }

  const existing = await prisma.emisorConfig.findFirst();
  const saved = existing
    ? await prisma.emisorConfig.update({ where: { id: existing.id }, data })
    : await prisma.emisorConfig.create({ data });

  revalidatePath("/admin/settings/facturacion-electronica");
  return { ok: true as const, emisorConfig: saved };
}

export async function searchCabys(query: string) {
  if (!query || query.trim().length < 3) {
    return { ok: false as const, message: "Escribe al menos 3 caracteres" };
  }
  try {
    const res = await fetch(`https://api.hacienda.go.cr/fe/cabys?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return { ok: false as const, message: "No se pudo consultar el catálogo CABYS" };
    }
    const json = await res.json();
    const results = (json.cabys || []).slice(0, 20).map((c: any) => ({
      codigo: c.codigo as string,
      descripcion: c.descripcion as string,
      impuesto: c.impuesto as number,
    }));
    return { ok: true as const, results };
  } catch {
    return { ok: false as const, message: "Error al conectar con el catálogo CABYS" };
  }
}

interface GenerateFacturaItemInput {
  id: string;
  cabysCode: string;
  unidadMedida: string;
}

interface GenerateFacturaInput {
  receptorIdentificacionTipo: string;
  receptorIdentificacionNumero: string;
  items: GenerateFacturaItemInput[];
}

export async function generateFacturaForWorkOrder(workOrderId: string, input: GenerateFacturaInput) {
  const user = await requireAdmin();
  if (!user) {
    return { ok: false as const, message: "Solo administradores pueden generar facturas" };
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { quote: { include: { customer: true, items: true } } },
  });
  if (!workOrder) return { ok: false as const, message: "Orden de trabajo no encontrada" };
  if (!workOrder.entregadoCompletedAt) {
    return { ok: false as const, message: "La orden debe estar en la etapa Entregado para generar la factura" };
  }

  const emisorConfig = await prisma.emisorConfig.findFirst();
  if (!emisorConfig) {
    return {
      ok: false as const,
      message: "Falta configurar los datos del emisor en Configuración > Facturación Electrónica",
    };
  }

  const quoteItems = workOrder.quote.items;
  if (quoteItems.length === 0) {
    return { ok: false as const, message: "La cotización no tiene ítems para facturar" };
  }

  const itemsById = new Map(input.items.map((i) => [i.id, i]));
  for (const qi of quoteItems) {
    const provided = itemsById.get(qi.id);
    if (!provided || !provided.cabysCode || provided.cabysCode.length !== 13) {
      return { ok: false as const, message: `Falta el código CABYS del ítem "${qi.description}"` };
    }
  }
  if (!/^\d{9}$|^\d{10}$|^\d{11}$|^\d{12}$/.test(input.receptorIdentificacionNumero)) {
    return { ok: false as const, message: "El número de identificación del cliente no es válido" };
  }

  // Guardar identificación/CABYS de vuelta para no volver a pedirlos la próxima vez
  if (workOrder.quote.customerId) {
    await prisma.customer.update({
      where: { id: workOrder.quote.customerId },
      data: {
        identificacionTipo: input.receptorIdentificacionTipo,
        identificacionNumero: input.receptorIdentificacionNumero,
      },
    });
  }
  await Promise.all(
    quoteItems.map((qi) => {
      const provided = itemsById.get(qi.id)!;
      return prisma.quoteItem.update({
        where: { id: qi.id },
        data: { cabysCode: provided.cabysCode, unidadMedida: provided.unidadMedida },
      });
    })
  );

  const TARIFA = 13;
  const CODIGO_TARIFA_IVA = "08";

  let cabysClassificationError: string | null = null;
  const lineas: LineaDetalleXmlData[] = await Promise.all(
    quoteItems.map(async (qi, idx) => {
      const provided = itemsById.get(qi.id)!;
      const subtotal = qi.quantity * qi.unitPrice;
      const montoImpuesto = subtotal * (TARIFA / 100);
      let esMercancia = false;
      try {
        esMercancia = await isCabysMercancia(provided.cabysCode);
      } catch (error: any) {
        cabysClassificationError = error.message;
      }
      return {
        numeroLinea: idx + 1,
        cabysCode: provided.cabysCode,
        esMercancia,
        cantidad: qi.quantity,
        unidadMedida: provided.unidadMedida,
        detalle: qi.description,
        precioUnitario: qi.unitPrice,
        montoTotal: subtotal,
        subtotal,
        tarifaImpuesto: TARIFA,
        codigoTarifaIVA: CODIGO_TARIFA_IVA,
        montoImpuesto,
        montoTotalLinea: subtotal + montoImpuesto,
      };
    })
  );
  if (cabysClassificationError) {
    return { ok: false as const, message: cabysClassificationError };
  }

  // Hacienda exige el total de mercancías (bienes físicos) separado del
  // total de servicios en el resumen — mezclarlos causa un rechazo.
  const totalServGravados = lineas.filter((l) => !l.esMercancia).reduce((s, l) => s + l.subtotal, 0);
  const totalMercanciasGravadas = lineas.filter((l) => l.esMercancia).reduce((s, l) => s + l.subtotal, 0);
  const totalImpuesto = lineas.reduce((s, l) => s + l.montoImpuesto, 0);
  const totalVenta = totalServGravados + totalMercanciasGravadas;
  const totalComprobante = totalVenta + totalImpuesto;

  const consecutivo = await buildConsecutivo("01");
  const clave = buildClaveNumerica(consecutivo, emisorConfig.identificacionNumero);
  const fechaEmision = fechaEmisionCR();

  const receptorNombre = workOrder.quote.customer?.name || workOrder.quote.clientName;
  const receptorCorreo = workOrder.quote.customer?.email || workOrder.quote.clientEmail || undefined;

  const xml = buildFacturaXML({
    clave,
    consecutivo,
    fechaEmision,
    emisor: {
      nombre: emisorConfig.nombre,
      nombreComercial: emisorConfig.nombreComercial,
      identificacionTipo: emisorConfig.identificacionTipo,
      identificacionNumero: emisorConfig.identificacionNumero,
      actividadEconomica: emisorConfig.actividadEconomica,
      provincia: emisorConfig.provincia,
      canton: emisorConfig.canton,
      distrito: emisorConfig.distrito,
      barrio: emisorConfig.barrio,
      otrasSenas: emisorConfig.otrasSenas,
      telefonoCodigoPais: emisorConfig.telefonoCodigoPais,
      telefono: emisorConfig.telefono,
      correoElectronico: emisorConfig.correoElectronico,
    },
    receptor: {
      nombre: receptorNombre,
      identificacionTipo: input.receptorIdentificacionTipo,
      identificacionNumero: input.receptorIdentificacionNumero,
      correoElectronico: receptorCorreo,
    },
    items: lineas,
    totalServGravados,
    totalMercanciasGravadas,
    totalGravado: totalVenta,
    totalVenta,
    totalVentaNeta: totalVenta,
    totalImpuesto,
    totalComprobante,
  });

  let signedXml: string;
  try {
    const p12Base64 = readP12Base64();
    const pin = getP12Pin();
    signedXml = await signXAdES(xml, p12Base64, pin);
  } catch (error: any) {
    return { ok: false as const, message: "Error al firmar el comprobante: " + error.message };
  }

  const doc = await prisma.electronicDocument.create({
    data: {
      tipo: "factura",
      clave,
      consecutivo,
      estado: "borrador",
      xmlFirmado: signedXml,
      fechaEmision: new Date(),
      quoteId: workOrder.quoteId,
    },
  });

  revalidatePath(`/admin/work-orders/${workOrderId}`);
  revalidatePath("/admin/invoices");
  return { ok: true as const, electronicDocument: doc };
}

export async function sendElectronicDocument(id: string) {
  const user = await requireAdmin();
  if (!user) {
    return { ok: false as const, message: "Solo administradores pueden enviar facturas a Hacienda" };
  }

  const doc = await prisma.electronicDocument.findUnique({ where: { id } });
  if (!doc) return { ok: false as const, message: "Comprobante no encontrado" };
  if (!["borrador", "rechazado", "error"].includes(doc.estado)) {
    return { ok: false as const, message: `El comprobante ya está en estado "${doc.estado}"` };
  }

  const emisorConfig = await prisma.emisorConfig.findFirst();
  if (!emisorConfig) return { ok: false as const, message: "Falta configurar los datos del emisor" };

  try {
    await submitDocument({
      clave: doc.clave,
      fecha: fechaEmisionCR(),
      emisorTipoIdentificacion: emisorConfig.identificacionTipo,
      emisorNumeroIdentificacion: emisorConfig.identificacionNumero,
      signedXml: doc.xmlFirmado,
    });
  } catch (error: any) {
    return { ok: false as const, message: "Error al enviar a Hacienda: " + error.message };
  }

  const updated = await prisma.electronicDocument.update({
    where: { id },
    data: { estado: "procesando" },
  });

  revalidatePath("/admin/invoices");
  return { ok: true as const, electronicDocument: updated };
}

export async function checkElectronicDocumentStatus(id: string) {
  const { allowed } = await getSectionAccess("admin.invoices");
  if (!allowed) return { ok: false as const, message: "No autorizado" };

  const doc = await prisma.electronicDocument.findUnique({ where: { id } });
  if (!doc) return { ok: false as const, message: "Comprobante no encontrado" };

  try {
    const status = await queryStatus(doc.clave);
    const updated = await prisma.electronicDocument.update({
      where: { id },
      data: { estado: status.estado, respuestaXml: status.respuestaXml },
    });
    revalidatePath("/admin/invoices");
    return { ok: true as const, electronicDocument: updated };
  } catch (error: any) {
    return { ok: false as const, message: "Error al consultar el estado: " + error.message };
  }
}

// Cada Orden de Trabajo ya entregada es candidata a facturar. Se listan
// todas (con o sin ElectronicDocument todavía) para que "Generar Factura" y
// "Enviar a Hacienda" vivan en un solo lugar: el módulo de Facturas.
export async function getWorkOrdersForInvoicing() {
  const { allowed } = await getSectionAccess("admin.invoices");
  if (!allowed) {
    throw new Error("No autorizado para ver las facturas");
  }

  const workOrders = await prisma.workOrder.findMany({
    where: { entregadoCompletedAt: { not: null } },
    include: {
      quote: { include: { customer: true, items: true } },
    },
    orderBy: { entregadoCompletedAt: "desc" },
  });

  const quoteIds = workOrders.map((wo) => wo.quoteId);
  const documents = await prisma.electronicDocument.findMany({
    where: { quoteId: { in: quoteIds } },
    orderBy: { createdAt: "desc" },
  });
  const latestByQuoteId = new Map<string, (typeof documents)[number]>();
  for (const doc of documents) {
    if (doc.quoteId && !latestByQuoteId.has(doc.quoteId)) {
      latestByQuoteId.set(doc.quoteId, doc);
    }
  }

  return workOrders.map((wo) => ({
    ...wo,
    electronicDocument: latestByQuoteId.get(wo.quoteId) || null,
  }));
}
