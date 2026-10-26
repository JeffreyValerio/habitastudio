import type { jsPDF } from 'jspdf';

/**
 * Logo de Habita Studio para los PDF (versión horizontal a color, fondo
 * transparente, ver design-source/LEEME.md). Un solo lugar para cliente y
 * servidor: ambos generadores dibujan con `drawPdfLogo`.
 */

export const PDF_LOGO_PUBLIC_PATH = '/brand/logo-pdf.png';
/** Ancho por defecto en mm (la guía de marca exige mínimo 30 mm). */
export const PDF_LOGO_DEFAULT_WIDTH_MM = 55;

export interface PdfLogo {
  dataUrl: string;
  /** Tamaño natural en píxeles (para conservar la proporción). */
  width: number;
  height: number;
}

/** Carga el logo en el navegador (fetch + FileReader). Devuelve null si falla. */
export async function loadPdfLogo(): Promise<PdfLogo | null> {
  try {
    const response = await fetch(PDF_LOGO_PUBLIC_PATH);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, ...size };
  } catch (error) {
    console.warn('No se pudo cargar el logo para el PDF:', error);
    return null;
  }
}

/**
 * Dibuja el logo conservando la proporción. Devuelve la altura dibujada en mm
 * (0 si no hay logo: no se dibuja nada).
 */
export function drawPdfLogo(
  doc: jsPDF,
  logo: PdfLogo | null,
  { x, y, width = PDF_LOGO_DEFAULT_WIDTH_MM }: { x: number; y: number; width?: number }
): number {
  if (!logo || !logo.width || !logo.height) return 0;
  try {
    const height = width * (logo.height / logo.width);
    doc.addImage(logo.dataUrl, 'PNG', x, y, width, height);
    return height;
  } catch (error) {
    console.warn('No se pudo agregar el logo al PDF:', error);
    return 0;
  }
}
