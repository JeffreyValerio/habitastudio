/**
 * Genera (sin enviar a Hacienda) la Factura Electrónica para una OT ya
 * entregada, replicando exactamente la lógica de generateFacturaForWorkOrder,
 * para poder probar el botón "Enviar a Hacienda" desde la UI real sin pasar
 * por el diálogo (uso puntual/manual, no se ejecuta desde la app).
 *
 * Uso: npx tsx scripts/generate-test-factura.ts <workOrderNumber>
 */
import "dotenv/config";
import prisma from "../lib/prisma";
import { buildConsecutivo, buildClaveNumerica, fechaEmisionCR } from "../lib/hacienda/clave";
import { buildFacturaXML, type LineaDetalleXmlData } from "../lib/hacienda/xml";
import { signXAdES } from "../lib/hacienda/sign";
import { readP12Base64, getP12Pin } from "../lib/hacienda/api";
import { isCabysMercancia } from "../lib/hacienda/cabys";

const CABYS_BY_DESCRIPTION: Record<string, string> = {
  Closet: "3814001020105",
  Transporte: "6511900009900",
};

const RECEPTOR_IDENTIFICACION_TIPO = "01";
const RECEPTOR_IDENTIFICACION_NUMERO = "000000000"; // valor de prueba obvio, confirmado con el usuario

async function main() {
  const workOrderNumber = process.argv[2];
  if (!workOrderNumber) throw new Error("Uso: npx tsx scripts/generate-test-factura.ts <workOrderNumber>");

  const workOrder = await prisma.workOrder.findFirst({
    where: { workOrderNumber },
    include: { quote: { include: { customer: true, items: true } } },
  });
  if (!workOrder) throw new Error(`No se encontró ${workOrderNumber}`);
  if (!workOrder.entregadoCompletedAt) throw new Error("La OT no está marcada como entregada");

  const emisorConfig = await prisma.emisorConfig.findFirst();
  if (!emisorConfig) throw new Error("Falta EmisorConfig");

  const quoteItems = workOrder.quote.items;

  if (workOrder.quote.customerId) {
    await prisma.customer.update({
      where: { id: workOrder.quote.customerId },
      data: {
        identificacionTipo: RECEPTOR_IDENTIFICACION_TIPO,
        identificacionNumero: RECEPTOR_IDENTIFICACION_NUMERO,
      },
    });
  }
  for (const qi of quoteItems) {
    const cabys = CABYS_BY_DESCRIPTION[qi.description];
    if (!cabys) throw new Error(`Sin código CABYS mapeado para "${qi.description}"`);
    await prisma.quoteItem.update({
      where: { id: qi.id },
      data: { cabysCode: cabys, unidadMedida: "Unid" },
    });
  }

  const TARIFA = 13;
  const CODIGO_TARIFA_IVA = "08";

  const lineas: LineaDetalleXmlData[] = await Promise.all(
    quoteItems.map(async (qi, idx) => {
      const cabys = CABYS_BY_DESCRIPTION[qi.description];
      const subtotal = qi.quantity * qi.unitPrice;
      const montoImpuesto = subtotal * (TARIFA / 100);
      const esMercancia = await isCabysMercancia(cabys);
      return {
        numeroLinea: idx + 1,
        cabysCode: cabys,
        esMercancia,
        cantidad: qi.quantity,
        unidadMedida: "Unid",
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
      identificacionTipo: RECEPTOR_IDENTIFICACION_TIPO,
      identificacionNumero: RECEPTOR_IDENTIFICACION_NUMERO,
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

  const p12Base64 = readP12Base64();
  const pin = getP12Pin();
  const signedXml = await signXAdES(xml, p12Base64, pin);

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

  console.log("✅ ElectronicDocument creado en estado 'borrador':");
  console.log("   id:", doc.id);
  console.log("   clave:", doc.clave);
  console.log("   consecutivo:", doc.consecutivo);
  console.log("   OT:", workOrder.workOrderNumber, "-> /admin/work-orders/" + workOrder.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERROR:", err);
    process.exit(1);
  });
