import { create } from "xmlbuilder2";

export interface EmisorXmlData {
  nombre: string;
  nombreComercial?: string | null;
  identificacionTipo: string;
  identificacionNumero: string;
  actividadEconomica: string;
  provincia: string;
  canton: string;
  distrito: string;
  barrio?: string | null;
  otrasSenas: string;
  telefonoCodigoPais: string;
  telefono: string;
  correoElectronico: string;
}

export interface ReceptorXmlData {
  nombre: string;
  identificacionTipo: string;
  identificacionNumero: string;
  correoElectronico?: string | null;
}

export interface LineaDetalleXmlData {
  numeroLinea: number;
  cabysCode: string;
  // Según el catálogo CABYS (categorias[0] empieza con "Bienes" o
  // "Servicios") — Hacienda exige separar el total de mercancías del total
  // de servicios en el resumen; mezclarlos produce un rechazo (-111/-110).
  esMercancia: boolean;
  cantidad: number;
  unidadMedida: string;
  detalle: string;
  precioUnitario: number;
  montoTotal: number;
  subtotal: number;
  tarifaImpuesto: number; // ej. 13
  codigoTarifaIVA: string; // ej. "08" para 13%
  montoImpuesto: number;
  montoTotalLinea: number;
}

export interface BuildFacturaXmlInput {
  clave: string;
  consecutivo: string;
  fechaEmision: string; // ISO con offset, ver fechaEmisionCR()
  emisor: EmisorXmlData;
  receptor: ReceptorXmlData;
  items: LineaDetalleXmlData[];
  totalServGravados: number;
  totalMercanciasGravadas: number;
  totalGravado: number;
  totalVenta: number;
  totalVentaNeta: number;
  totalImpuesto: number;
  totalComprobante: number;
  medioPago?: string; // "01" Efectivo, "02" Tarjeta, "04" Transferencia, etc.
}

const money = (n: number) => n.toFixed(5);
const money2 = (n: number) => n.toFixed(2);

export function buildFacturaXML(input: BuildFacturaXmlInput): string {
  const { emisor, receptor } = input;

  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("FacturaElectronica", {
    xmlns: "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  });

  doc
    .ele("Clave").txt(input.clave).up()
    .ele("ProveedorSistemas").txt(emisor.identificacionNumero).up()
    .ele("CodigoActividadEmisor").txt(emisor.actividadEconomica).up()
    .ele("NumeroConsecutivo").txt(input.consecutivo).up()
    .ele("FechaEmision").txt(input.fechaEmision).up();

  const emisorEl = doc.ele("Emisor");
  emisorEl.ele("Nombre").txt(emisor.nombre).up();
  const emisorIdEl = emisorEl.ele("Identificacion");
  emisorIdEl.ele("Tipo").txt(emisor.identificacionTipo).up();
  emisorIdEl.ele("Numero").txt(emisor.identificacionNumero).up();
  emisorIdEl.up();
  if (emisor.nombreComercial) {
    emisorEl.ele("NombreComercial").txt(emisor.nombreComercial).up();
  }
  const emisorUbicacionEl = emisorEl.ele("Ubicacion");
  emisorUbicacionEl.ele("Provincia").txt(emisor.provincia).up();
  emisorUbicacionEl.ele("Canton").txt(emisor.canton).up();
  emisorUbicacionEl.ele("Distrito").txt(emisor.distrito).up();
  if (emisor.barrio) {
    emisorUbicacionEl.ele("Barrio").txt(emisor.barrio).up();
  }
  emisorUbicacionEl.ele("OtrasSenas").txt(emisor.otrasSenas).up();
  emisorUbicacionEl.up();
  const emisorTelEl = emisorEl.ele("Telefono");
  emisorTelEl.ele("CodigoPais").txt(emisor.telefonoCodigoPais).up();
  emisorTelEl.ele("NumTelefono").txt(emisor.telefono).up();
  emisorTelEl.up();
  emisorEl.ele("CorreoElectronico").txt(emisor.correoElectronico).up();
  emisorEl.up();

  const receptorEl = doc.ele("Receptor");
  receptorEl.ele("Nombre").txt(receptor.nombre).up();
  const receptorIdEl = receptorEl.ele("Identificacion");
  receptorIdEl.ele("Tipo").txt(receptor.identificacionTipo).up();
  receptorIdEl.ele("Numero").txt(receptor.identificacionNumero).up();
  receptorIdEl.up();
  if (receptor.correoElectronico) {
    receptorEl.ele("CorreoElectronico").txt(receptor.correoElectronico).up();
  }
  receptorEl.up();

  doc.ele("CondicionVenta").txt("01").up(); // Contado

  const detalleEl = doc.ele("DetalleServicio");
  for (const item of input.items) {
    const lineaEl = detalleEl.ele("LineaDetalle");
    lineaEl.ele("NumeroLinea").txt(String(item.numeroLinea)).up();
    lineaEl.ele("CodigoCABYS").txt(item.cabysCode).up();
    lineaEl.ele("Cantidad").txt(item.cantidad.toFixed(3)).up();
    lineaEl.ele("UnidadMedida").txt(item.unidadMedida).up();
    lineaEl.ele("Detalle").txt(item.detalle).up();
    lineaEl.ele("PrecioUnitario").txt(money(item.precioUnitario)).up();
    lineaEl.ele("MontoTotal").txt(money(item.montoTotal)).up();
    lineaEl.ele("SubTotal").txt(money(item.subtotal)).up();
    lineaEl.ele("BaseImponible").txt(money(item.subtotal)).up();
    const impuestoEl = lineaEl.ele("Impuesto");
    impuestoEl.ele("Codigo").txt("01").up(); // IVA
    impuestoEl.ele("CodigoTarifaIVA").txt(item.codigoTarifaIVA).up();
    impuestoEl.ele("Tarifa").txt(item.tarifaImpuesto.toFixed(2)).up();
    impuestoEl.ele("Monto").txt(money(item.montoImpuesto)).up();
    impuestoEl.up();
    lineaEl.ele("ImpuestoAsumidoEmisorFabrica").txt("0.00000").up();
    lineaEl.ele("ImpuestoNeto").txt(money(item.montoImpuesto)).up();
    lineaEl.ele("MontoTotalLinea").txt(money(item.montoTotalLinea)).up();
    lineaEl.up();
  }
  detalleEl.up();

  const resumenEl = doc.ele("ResumenFactura");
  const monedaEl = resumenEl.ele("CodigoTipoMoneda");
  monedaEl.ele("CodigoMoneda").txt("CRC").up();
  monedaEl.ele("TipoCambio").txt("1.00000").up();
  monedaEl.up();
  if (input.totalServGravados > 0) {
    resumenEl.ele("TotalServGravados").txt(money(input.totalServGravados)).up();
  }
  if (input.totalMercanciasGravadas > 0) {
    resumenEl.ele("TotalMercanciasGravadas").txt(money(input.totalMercanciasGravadas)).up();
  }
  resumenEl.ele("TotalGravado").txt(money(input.totalGravado)).up();
  resumenEl.ele("TotalVenta").txt(money(input.totalVenta)).up();
  resumenEl.ele("TotalVentaNeta").txt(money(input.totalVentaNeta)).up();
  const desgloseEl = resumenEl.ele("TotalDesgloseImpuesto");
  desgloseEl.ele("Codigo").txt("01").up();
  desgloseEl.ele("CodigoTarifaIVA").txt("08").up();
  desgloseEl.ele("TotalMontoImpuesto").txt(money2(input.totalImpuesto)).up();
  desgloseEl.up();
  resumenEl.ele("TotalImpuesto").txt(money2(input.totalImpuesto)).up();
  const medioPagoEl = resumenEl.ele("MedioPago");
  medioPagoEl.ele("TipoMedioPago").txt(input.medioPago || "01").up();
  medioPagoEl.ele("TotalMedioPago").txt(money2(input.totalComprobante)).up();
  medioPagoEl.up();
  resumenEl.ele("TotalComprobante").txt(money2(input.totalComprobante)).up();
  resumenEl.up();

  return doc.end({ prettyPrint: false });
}
