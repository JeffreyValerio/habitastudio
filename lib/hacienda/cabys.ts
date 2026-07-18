// Clasifica un código CABYS como mercancía (bien físico) o servicio,
// según la categoría de más alto nivel que expone el catálogo público de
// Hacienda. Necesario porque el resumen de la Factura Electrónica exige
// separar "TotalServGravados" de "TotalMercanciasGravadas" — mezclarlos
// produce un rechazo (-111/-110), confirmado contra el sandbox real.
export async function isCabysMercancia(cabysCode: string): Promise<boolean> {
  const res = await fetch(`https://api.hacienda.go.cr/fe/cabys?codigo=${cabysCode}`);
  if (!res.ok) {
    throw new Error(`No se pudo clasificar el código CABYS ${cabysCode}`);
  }
  const json = await res.json();
  const categoriaTope: string | undefined = json?.[0]?.categorias?.[0];
  if (!categoriaTope) {
    throw new Error(`Código CABYS ${cabysCode} no encontrado en el catálogo`);
  }
  return categoriaTope.startsWith("Bienes");
}
