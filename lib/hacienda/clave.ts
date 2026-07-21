import prisma from "@/lib/prisma";

function pad(value: string | number, len: number): string {
  return String(value).padStart(len, "0");
}

// Consecutivo de 20 dígitos: sucursal(3) + terminal(5) + tipoDocumento(2) + numero(10).
// Habita Studio opera una sola sucursal/punto de venta, así que esos dos
// segmentos quedan fijos; el número es secuencial e independiente por tipo
// de documento (no se reinicia por año).
export async function buildConsecutivo(tipoDocumento: string): Promise<string> {
  const sequence = await prisma.$transaction(async (tx) => {
    const existing = await tx.electronicDocumentSequence.findUnique({
      where: { tipoDocumento },
    });
    const nextNumber = (existing?.lastNumber ?? 0) + 1;
    await tx.electronicDocumentSequence.upsert({
      where: { tipoDocumento },
      update: { lastNumber: nextNumber },
      create: { tipoDocumento, lastNumber: nextNumber },
    });
    return nextNumber;
  });

  const sucursal = "001";
  const terminal = "00001";
  return sucursal + terminal + tipoDocumento + pad(sequence, 10);
}

// Fecha de emisión en formato ISO con el offset explícito de Costa Rica
// (UTC-6 todo el año), tal como Hacienda la exige.
export function fechaEmisionCR(): string {
  return (
    new Date()
      .toLocaleString("sv-SE", { timeZone: "America/Costa_Rica" })
      .replace(" ", "T") + "-06:00"
  );
}

// Clave numérica de 50 dígitos: país(3) + fecha DDMMYY(6) + cédula emisor(12)
// + consecutivo(20) + situación(1) + código de seguridad(8).
//
// La fecha DDMMYY tiene que coincidir exactamente con el campo FechaEmision
// del comprobante (Hacienda rechaza con -405 si no calzan). Por eso se deriva
// del mismo string de fechaEmisionCR() en vez de leer un Date con
// getDate()/getMonth()/getFullYear(), que devuelven la fecha en la zona
// horaria del proceso — en Vercel eso es UTC, no Costa Rica (UTC-6), así que
// entre las 00:00 y 05:59 UTC (18:00-23:59 CR del día anterior) el día
// quedaba desfasado en un día respecto a fechaEmisionCR().
export function buildClaveNumerica(
  consecutivo: string,
  cedulaEmisor: string,
  fechaEmisionISO: string = fechaEmisionCR()
): string {
  const [yyyy, mm, dd] = fechaEmisionISO.slice(0, 10).split("-");
  const yy = yyyy.slice(-2);
  const cedula12 = pad(cedulaEmisor, 12);
  const situacion = "1"; // normal (no contingencia/sin internet)
  const codigoSeguridad = pad(Math.floor(Math.random() * 100000000), 8);

  const clave = "506" + dd + mm + yy + cedula12 + consecutivo + situacion + codigoSeguridad;
  if (clave.length !== 50) {
    throw new Error(`Clave numérica con longitud incorrecta: ${clave.length}`);
  }
  return clave;
}
