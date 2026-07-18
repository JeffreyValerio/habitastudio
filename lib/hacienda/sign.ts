import forge from "node-forge";
import { Crypto } from "@peculiar/webcrypto";
import * as xades from "xadesjs";
import * as xmlCore from "xml-core";
import { Convert } from "pvtsutils";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import xpath from "xpath";

const crypto = new Crypto();
xades.Application.setEngine("OpenSSL", crypto);
xmlCore.setNodeDependencies({ DOMParser, XMLSerializer, xpath });

// Política de firma vigente para v4.4 (resolución MH-DGT-RES-0027-2024).
// El hash es el SHA-1 real del PDF de la resolución, calculado una vez
// (ver FACTURACION_ELECTRONICA.md) — la mayoría de librerías de referencia
// para Costa Rica traen hardcodeada la política vieja de 2016, que Hacienda
// ya no acepta como válida para v4.4.
const POLICY_URL =
  "https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2024/v4.4/Resoluci%C3%B3n_General_sobre_disposiciones_t%C3%A9cnicas_comprobantes_electr%C3%B3nicos_para_efectos_tributarios.pdf";
const POLICY_DIGEST_SHA1 = "t1dgDPAT9tf9GqOanGItZw3tm+A=";

function stripPem(pem: string): string {
  return pem.replace(/-----(BEGIN|END)[\w\d\s]+-----/g, "").replace(/[\r\n]/g, "");
}

async function separateP12(p12Base64: string, pin: string) {
  const asn = forge.asn1.fromDer(forge.util.decode64(p12Base64));
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, pin);

  const keyData = p12
    .getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    [forge.pki.oids.pkcs8ShroudedKeyBag]!.concat(
      p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]!
    );
  const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyData[0].key!);
  const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
  const pemPrivate = forge.pki.privateKeyInfoToPem(privateKeyInfo);
  const pkey64 = stripPem(pemPrivate);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]!;
  const finalCert = forge.pki.certificateToPem(certBags[0].cert!);
  const cert64 = stripPem(finalCert);

  const preprivateKey = forge.pki.privateKeyFromPem(pemPrivate);
  const prepublicKey = forge.pki.setRsaPublicKey(preprivateKey.n, preprivateKey.e);
  const publicKey = forge.pki.publicKeyToPem(prepublicKey);
  const pbkey64 = stripPem(publicKey);

  return { cert64, pkey64, pbkey64 };
}

// Fecha de vencimiento del certificado dentro del .p12, para poder avisar
// con anticipación cuando esté por vencer (vigencia típica: 2 años).
export async function getP12ExpiryDate(p12Base64: string, pin: string): Promise<Date> {
  const asn = forge.asn1.fromDer(forge.util.decode64(p12Base64));
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, pin);
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]!;
  return certBags[0].cert!.validity.notAfter;
}

// Firma un XML de comprobante electrónico con XAdES-EPES usando la llave
// criptográfica (.p12) del contribuyente. Devuelve el XML firmado (string).
export async function signXAdES(xmlString: string, p12Base64: string, pin: string): Promise<string> {
  const { cert64, pkey64, pbkey64 } = await separateP12(p12Base64, pin);

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

  const signature = await xadesXml.Sign(alg, key, xml, {
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
    policy: {
      hash: "SHA-1",
      digestValue: POLICY_DIGEST_SHA1,
      identifier: {
        qualifier: "OIDAsURI",
        value: POLICY_URL,
      },
    },
  });

  xml.documentElement!.appendChild(signature.GetXml()!);
  return xmlCore.Stringify(xml);
}
