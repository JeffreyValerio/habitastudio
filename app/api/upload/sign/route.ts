import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { getSectionAccess } from "@/app/actions/role-permissions";

// Firma para subir directo del navegador a Cloudinary (sin pasar por nuestro
// servidor), necesario para archivos grandes como video: una función
// serverless de Vercel tiene un límite de payload (~4.5MB) muy por debajo de
// lo que pesa un video real, así que el archivo nunca puede viajar por
// /api/upload como sí hacen las imágenes.
export async function POST(request: NextRequest) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { folder } = (await request.json().catch(() => ({}))) as { folder?: string };
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { timestamp };
  if (folder) paramsToSign.folder = folder;

  const apiSecret = cloudinary.config().api_secret;
  const apiKey = cloudinary.config().api_key;
  const cloudName = cloudinary.config().cloud_name;

  if (!apiSecret || !apiKey || !cloudName) {
    return NextResponse.json({ error: "Cloudinary no está configurado" }, { status: 500 });
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return NextResponse.json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: folder || null,
  });
}
