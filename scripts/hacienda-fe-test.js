/**
 * Script de PRUEBA (no forma parte de la app todavía) para validar el flujo
 * completo de facturación electrónica contra el ambiente sandbox de Hacienda:
 * construir un XML mínimo de Factura Electrónica v4.4, firmarlo con XAdES-EPES
 * usando la llave criptográfica de pruebas, enviarlo, y consultar su estado.
 *
 * Uso: node scripts/hacienda-fe-test.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const { create } = require("xmlbuilder2");
const { Crypto } = require("@peculiar/webcrypto");
const xades = require("xadesjs");
const xmlCore = require("xml-core");
const { Convert } = require("pvtsutils");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const xpath = require("xpath");

const crypto = new Crypto();
xades.Application.setEngine("OpenSSL", crypto);
xmlCore.setNodeDependencies({ DOMParser, XMLSerializer, xpath });

// --- Datos del emisor de PRUEBA (Jeffrey, persona física, coincide con el certificado sandbox) ---
const EMISOR = {
  nombre: "JEFFRY JOSE VALERIO ANGULO",
  tipoIdentificacion: "01", // Cédula Física
  identificacion: "114810425",
  // El campo es de 6 CARACTERES (no 6 dígitos): va literal "4719.9" con el
  // punto incluido, confirmado viendo el XML real de un comprobante aceptado.
  codigoActividad: "4719.9",
  provincia: "1", // San José
  canton: "08", // Goicoechea
  distrito: "02", // San Francisco (código INEC 10802, confirmado por el usuario)
  barrio: "SAN FRANCISCO",
  otrasSenas: "100 NORTE Y 50 ESTE DEL SUPER NUEVO AMANECER",
  telefonoCodigoPais: "506",
  telefono: "88888888",
  correo: "jeffreyvalerio@hotmail.com",
};

// --- Receptor de PRUEBA: reusamos la cédula del emisor (identidad real y
// registrada) para evitar el error "-38 número de identificación del
// receptor no corresponde a un registro válido" con una cédula inventada. ---
const RECEPTOR = {
  nombre: EMISOR.nombre,
  tipoIdentificacion: EMISOR.tipoIdentificacion,
  identificacion: EMISOR.identificacion,
  correo: EMISOR.correo,
};

function pad(num, len) {
  return String(num).padStart(len, "0");
}

function buildConsecutivo() {
  const sucursal = "001";
  const terminal = "00001";
  const tipoDocumento = "01"; // Factura Electrónica
  const numero = pad(1, 10);
  return sucursal + terminal + tipoDocumento + numero;
}

function buildClaveNumerica(consecutivo) {
  const now = new Date();
  const dd = pad(now.getDate(), 2);
  const mm = pad(now.getMonth() + 1, 2);
  const yy = pad(now.getFullYear() % 100, 2);
  const cedula12 = pad(EMISOR.identificacion, 12);
  const situacion = "1"; // normal
  const codigoSeguridad = pad(Math.floor(Math.random() * 100000000), 8);
  const clave = "506" + dd + mm + yy + cedula12 + consecutivo + situacion + codigoSeguridad;
  if (clave.length !== 50) {
    throw new Error(`Clave numérica con longitud incorrecta: ${clave.length}`);
  }
  return clave;
}

function fechaEmisionCR() {
  // Costa Rica es UTC-6 todo el año (sin horario de verano). Hacienda exige
  // que la hora de FechaEmision coincida con la hora oficial, así que hay que
  // ser explícitos con el offset en vez de mandar la hora UTC "pelada".
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Costa_Rica" }).replace(" ", "T") + "-06:00";
}

function buildFacturaXML({ clave, consecutivo, fechaEmision }) {

  const cantidad = "1.000";
  const precioUnitario = "50000.00000";
  const montoTotalLinea = "50000.00000";
  const subtotal = "50000.00000";
  const impuestoMonto = "6500.00000"; // 13% de 50000
  const montoTotalLineaConImpuesto = "56500.00000";
  const totalVenta = "50000.00";
  const totalImpuesto = "6500.00";
  const totalComprobante = "56500.00";

  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("FacturaElectronica", {
      xmlns: "https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica",
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    })
    .ele("Clave").txt(clave).up()
    .ele("ProveedorSistemas").txt(EMISOR.identificacion).up()
    .ele("CodigoActividadEmisor").txt(EMISOR.codigoActividad).up()
    .ele("NumeroConsecutivo").txt(consecutivo).up()
    .ele("FechaEmision").txt(fechaEmision).up()
    .ele("Emisor")
      .ele("Nombre").txt(EMISOR.nombre).up()
      .ele("Identificacion")
        .ele("Tipo").txt(EMISOR.tipoIdentificacion).up()
        .ele("Numero").txt(EMISOR.identificacion).up()
      .up()
      .ele("Ubicacion")
        .ele("Provincia").txt(EMISOR.provincia).up()
        .ele("Canton").txt(EMISOR.canton).up()
        .ele("Distrito").txt(EMISOR.distrito).up()
        .ele("Barrio").txt(EMISOR.barrio).up()
        .ele("OtrasSenas").txt(EMISOR.otrasSenas).up()
      .up()
      .ele("Telefono")
        .ele("CodigoPais").txt(EMISOR.telefonoCodigoPais).up()
        .ele("NumTelefono").txt(EMISOR.telefono).up()
      .up()
      .ele("CorreoElectronico").txt(EMISOR.correo).up()
    .up()
    .ele("Receptor")
      .ele("Nombre").txt(RECEPTOR.nombre).up()
      .ele("Identificacion")
        .ele("Tipo").txt(RECEPTOR.tipoIdentificacion).up()
        .ele("Numero").txt(RECEPTOR.identificacion).up()
      .up()
      .ele("CorreoElectronico").txt(RECEPTOR.correo).up()
    .up()
    .ele("CondicionVenta").txt("01").up() // Contado
    .ele("DetalleServicio")
      .ele("LineaDetalle")
        .ele("NumeroLinea").txt("1").up()
        .ele("CodigoCABYS").txt("8316100000000").up() // Servicios de gestión de redes informáticas (código real, vía API pública CABYS)
        .ele("Cantidad").txt(cantidad).up()
        .ele("UnidadMedida").txt("Sp").up() // Servicio
        .ele("Detalle").txt("Servicio de prueba - integracion facturacion electronica").up()
        .ele("PrecioUnitario").txt(precioUnitario).up()
        .ele("MontoTotal").txt(montoTotalLinea).up()
        .ele("SubTotal").txt(subtotal).up()
        .ele("BaseImponible").txt(subtotal).up()
        .ele("Impuesto")
          .ele("Codigo").txt("01").up() // IVA
          .ele("CodigoTarifaIVA").txt("08").up() // 13%
          .ele("Tarifa").txt("13").up()
          .ele("Monto").txt(impuestoMonto).up()
        .up()
        .ele("ImpuestoAsumidoEmisorFabrica").txt("0.00000").up()
        .ele("ImpuestoNeto").txt(impuestoMonto).up()
        .ele("MontoTotalLinea").txt(montoTotalLineaConImpuesto).up()
      .up()
    .up()
    .ele("ResumenFactura")
      .ele("CodigoTipoMoneda")
        .ele("CodigoMoneda").txt("CRC").up()
        .ele("TipoCambio").txt("1.00000").up()
      .up()
      .ele("TotalServGravados").txt(totalVenta).up()
      .ele("TotalGravado").txt(totalVenta).up()
      .ele("TotalVenta").txt(totalVenta).up()
      .ele("TotalVentaNeta").txt(totalVenta).up()
      .ele("TotalDesgloseImpuesto")
        .ele("Codigo").txt("01").up()
        .ele("CodigoTarifaIVA").txt("08").up()
        .ele("TotalMontoImpuesto").txt(totalImpuesto).up()
      .up()
      .ele("TotalImpuesto").txt(totalImpuesto).up()
      .ele("MedioPago")
        .ele("TipoMedioPago").txt("01").up() // Efectivo
        .ele("TotalMedioPago").txt(totalComprobante).up()
      .up()
      .ele("TotalComprobante").txt(totalComprobante).up()
    .up();

  return doc.end({ prettyPrint: false });
}

async function separateP12(p12Base64, pin) {
  const asn = forge.asn1.fromDer(forge.util.decode64(p12Base64));
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, pin);
  const keyData = p12
    .getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    [forge.pki.oids.pkcs8ShroudedKeyBag].concat(
      p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]
    );
  const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyData[0].key);
  const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
  const pemPrivate = forge.pki.privateKeyInfoToPem(privateKeyInfo);
  const pkey64 = stripPem(pemPrivate);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
  const finalCert = forge.pki.certificateToPem(certBags[0].cert);
  const cert64 = stripPem(finalCert);

  const preprivateKey = forge.pki.privateKeyFromPem(pemPrivate);
  const prepublicKey = forge.pki.setRsaPublicKey(preprivateKey.n, preprivateKey.e);
  const publicKey = forge.pki.publicKeyToPem(prepublicKey);
  const pbkey64 = stripPem(publicKey);

  return { pkey64, cert64, pbkey64 };
}

function stripPem(pem) {
  return pem.replace(/-----(BEGIN|END)[\w\d\s]+-----/g, "").replace(/[\r\n]/g, "");
}

async function signXAdES(xmlString, cert64, pkey64, pbkey64) {
  const hash = "SHA-256";
  const alg = {
    name: "RSASSA-PKCS1-v1_5",
    hash,
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  };

  const publicKeyDer = Convert.FromBase64(pbkey64);
  const publicKey = await crypto.subtle.importKey("spki", publicKeyDer, alg, true, ["verify"]);

  const keyDer = Convert.FromBase64(pkey64);
  const key = await crypto.subtle.importKey("pkcs8", keyDer, alg, false, ["sign"]);

  const xml = xades.Parse(xmlString);
  const xadesXml = new xades.SignedXml();

  const signature = await xadesXml.Sign(
    alg,
    key,
    xml,
    {
      keyValue: publicKey,
      references: [
        {
          uri: "",
          hash,
          transforms: ["enveloped"],
        },
      ],
      signerRole: { claimed: ["ObligadoTributario"] },
      x509: [cert64],
      signingCertificate: cert64,
      // Política de firma v4.4 (resolución MH-DGT-RES-0027-2024), NO la v4.1
      // hardcodeada en la mayoría de librerías de referencia encontradas.
      policy: {
        hash: "SHA-1",
        digestValue: "t1dgDPAT9tf9GqOanGItZw3tm+A=",
        identifier: {
          qualifier: "OIDAsURI",
          value:
            "https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/Resoluci%C3%B3n_General_sobre_disposiciones_t%C3%A9cnicas_comprobantes_electr%C3%B3nicos_para_efectos_tributarios.pdf",
        },
      },
    }
  );

  xml.documentElement.appendChild(signature.GetXml());
  return xmlCore.Stringify(xml);
}

async function getAccessToken() {
  const params = new URLSearchParams();
  params.set("grant_type", "password");
  params.set("client_id", process.env.HACIENDA_FE_CLIENT_ID);
  params.set("username", process.env.HACIENDA_FE_USERNAME);
  params.set("password", process.env.HACIENDA_FE_PASSWORD);

  const res = await fetch(process.env.HACIENDA_FE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

async function main() {
  console.log("1. Construyendo XML...");
  const consecutivo = buildConsecutivo();
  const clave = buildClaveNumerica(consecutivo);
  console.log("   Clave:", clave, `(len=${clave.length})`);
  console.log("   Consecutivo:", consecutivo, `(len=${consecutivo.length})`);

  const fechaEmision = fechaEmisionCR();
  console.log("   FechaEmision:", fechaEmision);
  const xml = buildFacturaXML({ clave, consecutivo, fechaEmision });
  const xmlPath = path.join(__dirname, "..", ".secrets", "factura-prueba-sin-firmar.xml");
  fs.writeFileSync(xmlPath, xml);
  console.log("   XML sin firmar guardado en:", xmlPath);

  console.log("2. Leyendo llave criptográfica...");
  const p12Path = path.join(__dirname, "..", process.env.HACIENDA_FE_P12_PATH);
  const p12Base64 = fs.readFileSync(p12Path).toString("base64");
  const pin = process.env.HACIENDA_FE_P12_PIN;
  const { cert64, pkey64, pbkey64 } = await separateP12(p12Base64, pin);
  console.log("   Certificado y llave privada extraídos correctamente.");

  console.log("3. Firmando XML (XAdES-EPES)...");
  const signedXml = await signXAdES(xml, cert64, pkey64, pbkey64);
  const signedXmlPath = path.join(__dirname, "..", ".secrets", "factura-prueba-firmada.xml");
  fs.writeFileSync(signedXmlPath, signedXml);
  console.log("   XML firmado guardado en:", signedXmlPath);

  console.log("4. Obteniendo token OAuth...");
  const accessToken = await getAccessToken();
  console.log("   Token obtenido.");

  console.log("5. Enviando a Hacienda (sandbox)...");
  const body = {
    clave,
    fecha: fechaEmision,
    emisor: {
      tipoIdentificacion: EMISOR.tipoIdentificacion,
      numeroIdentificacion: EMISOR.identificacion,
    },
    receptor: {
      tipoIdentificacion: RECEPTOR.tipoIdentificacion,
      numeroIdentificacion: RECEPTOR.identificacion,
    },
    comprobanteXml: Buffer.from(signedXml, "utf-8").toString("base64"),
  };

  const sendRes = await fetch(process.env.HACIENDA_FE_API_URL + "/recepcion", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log("   HTTP status:", sendRes.status);
  const sendText = await sendRes.text();
  console.log("   Respuesta:", sendText || "(vacío)");

  if (sendRes.status !== 201 && sendRes.status !== 202) {
    console.log("\n--- No continúa a consulta de estado, revisar el error arriba ---");
    return;
  }

  console.log("6. Consultando estado...");
  await new Promise((r) => setTimeout(r, 3000));
  const statusRes = await fetch(process.env.HACIENDA_FE_API_URL + "/recepcion/" + clave, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  console.log("   HTTP status:", statusRes.status);
  const statusJson = await statusRes.json();
  console.log("   ind-estado:", statusJson["ind-estado"]);
  if (statusJson["respuesta-xml"]) {
    const respuesta = Buffer.from(statusJson["respuesta-xml"], "base64").toString("utf-8");
    console.log("   respuesta-xml decodificado:\n", respuesta);
  }
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
