import type { jsPDF } from 'jspdf';

/** Condiciones de la cotización (única fuente para los PDFs de servidor y cliente). */
export const QUOTE_CONDITIONS: string[] = [
  'Garantía: 12 meses por defectos de fabricación.',
  'Forma de pago: adelanto del 50% para iniciar la fabricación y 50% restante al finalizar.',
  'Tiempo de entrega: 15 días hábiles a partir de la recepción del adelanto y de la aprobación del diseño y las medidas.',
  'Por tratarse de muebles fabricados a medida, no se realizan devoluciones de dinero una vez iniciada la fabricación, incluyendo cambios de opinión, de diseño o de medidas posteriores a la aprobación. Esto no afecta la garantía por defectos de fabricación.',
  'Cualquier cambio solicitado después de la aprobación puede generar costos adicionales y modificar el tiempo de entrega.',
];

/** Índice de la condición de no devolución (se resalta en negrita). */
export const NO_REFUND_CONDITION_INDEX = 3;

export const QUOTE_ACCEPTANCE_TITLE = 'ACEPTACIÓN DEL CLIENTE';
export const QUOTE_ACCEPTANCE_TEXT =
  'Declaro que revisé y apruebo el diseño, las medidas, los materiales, los acabados y las condiciones descritas en esta cotización, incluida la política de no devolución de dinero.';

export const QUOTE_FOOTER_TEXT =
  'Cotización válida por el período indicado. Una vez firmada por el cliente, constituye la aprobación del diseño, las medidas y las condiciones.';

export const QUOTE_BANK_LINES: string[] = [
  'Sinpe Móvil: 63644915',
  'Cliente: MICHAEL ANDRES VALERIO ANGULO',
  'Número de cuenta BAC: 944908482',
  'Número de cuenta IBAN: CR47010200009449084829',
];

interface TermsLayout {
  startY: number;
  margin: number;
  contentWidth: number;
  pageHeight: number;
  clientName?: string | null;
}

// Espacio reservado abajo para el pie de página (footerY = pageHeight - 15)
const BOTTOM_RESERVE = 25;
const LINE_H = 5;

/**
 * Dibuja Condiciones, Datos bancarios y Aceptación del cliente.
 * Cada sección se mueve completa a una página nueva si no cabe.
 * Devuelve la posición Y final.
 */
export function drawQuoteTerms(doc: jsPDF, opts: TermsLayout): number {
  const { margin, contentWidth, pageHeight } = opts;
  const limit = pageHeight - BOTTOM_RESERVE;
  let y = opts.startY + 12;

  const ensure = (needed: number) => {
    if (y + needed > limit) {
      doc.addPage();
      y = margin;
    }
  };

  // --- Condiciones ---
  const bulletX = margin + 3;
  const textX = margin + 7;
  const textW = contentWidth - 7;
  doc.setFontSize(10);
  const condLines = QUOTE_CONDITIONS.map((c, i) => {
    doc.setFont('helvetica', i === NO_REFUND_CONDITION_INDEX ? 'bold' : 'normal');
    return doc.splitTextToSize(c, textW) as string[];
  });
  const condHeight =
    8 + condLines.reduce((s, l) => s + l.length * LINE_H + 2, 0);
  ensure(condHeight);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CONDICIONES DE PAGO Y ENTREGA', margin, y);
  y += 8;
  doc.setFontSize(10);
  condLines.forEach((lines, i) => {
    doc.setFont('helvetica', i === NO_REFUND_CONDITION_INDEX ? 'bold' : 'normal');
    doc.text('•', bulletX, y);
    doc.text(lines, textX, y);
    y += lines.length * LINE_H + 2;
  });

  // --- Datos bancarios ---
  y += 6;
  ensure(8 + QUOTE_BANK_LINES.length * 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS BANCARIOS', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  QUOTE_BANK_LINES.forEach((l) => {
    doc.text(l, margin + 3, y);
    y += 6;
  });

  // --- Aceptación del cliente ---
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const accLines = doc.splitTextToSize(QUOTE_ACCEPTANCE_TEXT, contentWidth) as string[];
  const rowH = 13;
  doc.setFontSize(10);
  const nameLabelW = doc.getTextWidth('Nombre completo: ');
  const nameLines = opts.clientName
    ? (doc.splitTextToSize(opts.clientName, contentWidth - nameLabelW - 1) as string[])
    : [''];
  const nameRowH = rowH + (nameLines.length - 1) * LINE_H;
  ensure(8 + accLines.length * LINE_H + 4 + 6 + nameRowH + rowH * 2 + 2);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(QUOTE_ACCEPTANCE_TITLE, margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(accLines, margin, y);
  y += accLines.length * LINE_H + 4;

  const gap = 10;
  const colW = (contentWidth - gap) / 2;
  const leftX = margin;
  const rightX = margin + colW + gap;

  const field = (label: string, x: number, w: number, fy: number, small = false) => {
    doc.setFontSize(small ? 9 : 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lw = doc.getTextWidth(label + ' ');
    doc.text(label, x, fy);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(x + lw, fy + 1, x + w, fy + 1);
  };

  y += 6;
  // Nombre completo: fila de ancho completo, nombre nunca truncado
  field('Nombre completo:', margin, contentWidth, y + (nameLines.length - 1) * LINE_H);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  nameLines.forEach((l, i) => {
    doc.text(l, margin + nameLabelW + 1, y + i * LINE_H);
    if (i < nameLines.length - 1) {
      doc.line(margin + nameLabelW, y + i * LINE_H + 1, margin + contentWidth, y + i * LINE_H + 1);
    }
  });
  y += nameRowH;
  field('Cédula:', leftX, colW, y);
  field('Fecha:', rightX, colW, y);
  y += rowH;
  field('Firma:', leftX, colW, y);
  field('Por Habita Studio:', rightX, colW, y, true);
  y += 2;

  return y;
}
