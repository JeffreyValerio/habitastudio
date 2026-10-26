import { readFile } from 'fs/promises';
import { join } from 'path';
import { PDF_LOGO_PUBLIC_PATH, type PdfLogo } from './pdf-logo';

export { drawPdfLogo } from './pdf-logo';

// Ancho/alto desde el encabezado IHDR de un PNG (bytes 16-23, big-endian).
function readPngSize(buf: Buffer): { width: number; height: number } {
  const signature = '89504e470d0a1a0a';
  if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('El logo no es un PNG válido');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function toLogo(buf: Buffer): PdfLogo {
  return { dataUrl: `data:image/png;base64,${buf.toString('base64')}`, ...readPngSize(buf) };
}

/**
 * Carga el logo en el servidor: primero desde public/ (filesystem) y, si no
 * está disponible, desde la URL pública. Devuelve null si falla.
 */
export async function loadPdfLogo(): Promise<PdfLogo | null> {
  try {
    return toLogo(await readFile(join(process.cwd(), 'public', PDF_LOGO_PUBLIC_PATH)));
  } catch {
    // probar la URL pública
  }
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://www.habitastudio.online';
    const response = await fetch(`${baseUrl}${PDF_LOGO_PUBLIC_PATH}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return toLogo(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF:', error);
    return null;
  }
}
