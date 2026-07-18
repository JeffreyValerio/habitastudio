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

// Clave numérica de 50 dígitos: país(3) + fecha DDMMYY(6) + cédula emisor(12)
// + consecutivo(20) + situación(1) + código de seguridad(8).
export function buildClaveNumerica(
  consecutivo: string,
  cedulaEmisor: string,
  fecha: Date = new Date()
): string {
  const dd = pad(fecha.getDate(), 2);
  const mm = pad(fecha.getMonth() + 1, 2);
  const yy = pad(fecha.getFullYear() % 100, 2);
  const cedula12 = pad(cedulaEmisor, 12);
  const situacion = "1"; // normal (no contingencia/sin internet)
  const codigoSeguridad = pad(Math.floor(Math.random() * 100000000), 8);

  const clave = "506" + dd + mm + yy + cedula12 + consecutivo + situacion + codigoSeguridad;
  if (clave.length !== 50) {
    throw new Error(`Clave numérica con longitud incorrecta: ${clave.length}`);
  }
  return clave;
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
