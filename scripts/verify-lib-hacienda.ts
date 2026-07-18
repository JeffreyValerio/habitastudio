/**
 * Verificación de la Fase 2: confirma que los módulos lib/hacienda/*
 * (xml, sign, api, clave) ya integrados a la app producen el mismo
 * resultado exitoso que el script original probado manualmente.
 * No toca ninguna Quote/WorkOrder real — usa datos de prueba (sandbox).
 *
 * Uso: npx tsx scripts/verify-lib-hacienda.ts
 */
import "dotenv/config";
import { buildFacturaXML, type LineaDetalleXmlData } from "../lib/hacienda/xml";
import { signXAdES } from "../lib/hacienda/sign";
import { buildClaveNumerica, fechaEmisionCR } from "../lib/hacienda/clave";
import { submitDocument, queryStatus, readP12Base64, getP12Pin } from "../lib/hacienda/api";

const EMISOR = {
  nombre: "JEFFRY JOSE VALERIO ANGULO",
  identificacionTipo: "01",
  identificacionNumero: "114810425",
  actividadEconomica: "4719.9",
  provincia: "1",
  canton: "08",
  distrito: "02",
  barrio: "SAN FRANCISCO",
  otrasSenas: "100 NORTE Y 50 ESTE DEL SUPER NUEVO AMANECER",
  telefonoCodigoPais: "506",
  telefono: "88888888",
  correoElectronico: "jeffreyvalerio@hotmail.com",
};

async function main() {
  const consecutivo = "00100001010000000" + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  const clave = buildClaveNumerica(consecutivo, EMISOR.identificacionNumero);
  const fechaEmision = fechaEmisionCR();

  const items: LineaDetalleXmlData[] = [
    {
      numeroLinea: 1,
      cabysCode: "8316100000000",
      esMercancia: false,
      cantidad: 1,
      unidadMedida: "Sp",
      detalle: "Prueba de verificacion lib/hacienda (Fase 2)",
      precioUnitario: 25000,
      montoTotal: 25000,
      subtotal: 25000,
      tarifaImpuesto: 13,
      codigoTarifaIVA: "08",
      montoImpuesto: 3250,
      montoTotalLinea: 28250,
    },
  ];

  const xml = buildFacturaXML({
    clave,
    consecutivo,
    fechaEmision,
    emisor: EMISOR,
    receptor: {
      nombre: EMISOR.nombre,
      identificacionTipo: EMISOR.identificacionTipo,
      identificacionNumero: EMISOR.identificacionNumero,
      correoElectronico: EMISOR.correoElectronico,
    },
    items,
    totalServGravados: 25000,
    totalMercanciasGravadas: 0,
    totalGravado: 25000,
    totalVenta: 25000,
    totalVentaNeta: 25000,
    totalImpuesto: 3250,
    totalComprobante: 28250,
  });
  console.log("1. XML construido. Longitud:", xml.length, "clave:", clave);

  const p12Base64 = readP12Base64();
  const pin = getP12Pin();
  const signedXml = await signXAdES(xml, p12Base64, pin);
  console.log("2. XML firmado. Longitud:", signedXml.length);

  await submitDocument({
    clave,
    fecha: fechaEmision,
    emisorTipoIdentificacion: EMISOR.identificacionTipo,
    emisorNumeroIdentificacion: EMISOR.identificacionNumero,
    receptorTipoIdentificacion: EMISOR.identificacionTipo,
    receptorNumeroIdentificacion: EMISOR.identificacionNumero,
    signedXml,
  });
  console.log("3. Enviado a Hacienda.");

  await new Promise((r) => setTimeout(r, 3000));
  const status = await queryStatus(clave);
  console.log("4. Estado:", status.estado);
  if (status.estado !== "aceptado") {
    console.log(status.respuestaXml);
    process.exit(1);
  }
  console.log("✅ Aceptado — lib/hacienda/* funciona igual que el script original.");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
