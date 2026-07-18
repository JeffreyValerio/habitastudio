import fs from "fs";
import path from "path";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams();
  params.set("grant_type", "password");
  params.set("client_id", env("HACIENDA_FE_CLIENT_ID"));
  params.set("username", env("HACIENDA_FE_USERNAME"));
  params.set("password", env("HACIENDA_FE_PASSWORD"));

  const res = await fetch(env("HACIENDA_FE_TOKEN_URL"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`No se pudo obtener el token de Hacienda: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

// Prioriza HACIENDA_FE_P12_BASE64 (necesario en Vercel: el filesystem del
// deploy no incluye .secrets/, que está en .gitignore). HACIENDA_FE_P12_PATH
// queda como conveniencia solo para desarrollo local.
export function readP12Base64(): string {
  const inlineBase64 = process.env.HACIENDA_FE_P12_BASE64;
  if (inlineBase64) return inlineBase64;

  const p12Path = path.join(process.cwd(), env("HACIENDA_FE_P12_PATH"));
  return fs.readFileSync(p12Path).toString("base64");
}

export function getP12Pin(): string {
  return env("HACIENDA_FE_P12_PIN");
}

export interface SubmitDocumentInput {
  clave: string;
  fecha: string;
  emisorTipoIdentificacion: string;
  emisorNumeroIdentificacion: string;
  receptorTipoIdentificacion?: string;
  receptorNumeroIdentificacion?: string;
  signedXml: string;
}

export async function submitDocument(input: SubmitDocumentInput): Promise<void> {
  const accessToken = await getAccessToken();

  const body: Record<string, unknown> = {
    clave: input.clave,
    fecha: input.fecha,
    emisor: {
      tipoIdentificacion: input.emisorTipoIdentificacion,
      numeroIdentificacion: input.emisorNumeroIdentificacion,
    },
    comprobanteXml: Buffer.from(input.signedXml, "utf-8").toString("base64"),
  };
  if (input.receptorTipoIdentificacion && input.receptorNumeroIdentificacion) {
    body.receptor = {
      tipoIdentificacion: input.receptorTipoIdentificacion,
      numeroIdentificacion: input.receptorNumeroIdentificacion,
    };
  }

  const res = await fetch(env("HACIENDA_FE_API_URL") + "/recepcion", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status !== 201 && res.status !== 202) {
    throw new Error(`Hacienda rechazó el envío: ${res.status} ${await res.text()}`);
  }
}

export interface HaciendaStatus {
  estado: string; // recibido, procesando, aceptado, rechazado, error
  respuestaXml: string | null; // XML decodificado (no base64)
}

export async function queryStatus(clave: string): Promise<HaciendaStatus> {
  const accessToken = await getAccessToken();

  const res = await fetch(env("HACIENDA_FE_API_URL") + "/recepcion/" + clave, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (!res.ok) {
    throw new Error(`No se pudo consultar el estado en Hacienda: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  const respuestaXml = json["respuesta-xml"]
    ? Buffer.from(json["respuesta-xml"], "base64").toString("utf-8")
    : null;

  return { estado: json["ind-estado"] as string, respuestaXml };
}
