import { jsPDF } from 'jspdf';
import { drawPdfLogo, loadPdfLogo } from './pdf-logo-server';

interface InvoiceItem {
  descripcion: string;
  cabysCode: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

interface Invoice {
  clave: string;
  consecutivo: string;
  estado: string;
  fechaEmision: Date;
  emisorNombre: string;
  emisorIdentificacion: string;
  receptorNombre: string;
  receptorIdentificacion: string;
  receptorEmail?: string | null;
  items: InvoiceItem[];
  totalVenta: number;
  totalImpuesto: number;
  totalComprobante: number;
}

interface SimpleInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SimpleInvoice {
  numero: string;
  fecha: Date;
  clientName: string;
  clientEmail?: string | null;
  items: SimpleInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `CRC ${formatted}`;
}

/**
 * Versión servidor (Buffer) de la factura electrónica formal — para
 * adjuntarla en el email al cliente. Misma disposición que la versión
 * cliente en lib/generate-invoice-pdf.ts.
 */
export async function generateInvoicePDFBuffer(invoice: Invoice): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const logo = await loadPdfLogo();
  const logoHeight = drawPdfLogo(doc, logo, { x: margin, y: yPosition });
  yPosition += logoHeight + 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 14;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Clave: ${invoice.clave}`, margin, yPosition);
  yPosition += 4;
  doc.text(`Consecutivo: ${invoice.consecutivo}`, margin, yPosition);
  yPosition += 4;
  doc.text(
    `Fecha de emisión: ${new Date(invoice.fechaEmision).toLocaleString('es-CR', { dateStyle: 'long', timeStyle: 'short' })}`,
    margin,
    yPosition
  );
  yPosition += 12;

  const gridGap = 20;
  const leftColWidth = (contentWidth - gridGap) / 2;
  const rightColStart = margin + leftColWidth + gridGap;

  let emisorY = yPosition;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('EMISOR', margin, emisorY);
  emisorY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.emisorNombre, margin, emisorY);
  emisorY += 5;
  doc.text(`Cédula: ${invoice.emisorIdentificacion}`, margin, emisorY);

  let receptorY = yPosition;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEPTOR', rightColStart + leftColWidth, receptorY, { align: 'right' });
  receptorY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.receptorNombre, rightColStart + leftColWidth, receptorY, { align: 'right' });
  receptorY += 5;
  doc.text(`Cédula: ${invoice.receptorIdentificacion}`, rightColStart + leftColWidth, receptorY, { align: 'right' });
  if (invoice.receptorEmail) {
    receptorY += 5;
    doc.text(invoice.receptorEmail, rightColStart + leftColWidth, receptorY, { align: 'right' });
  }

  yPosition = Math.max(emisorY, receptorY) + 14;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DETALLE DE ITEMS', margin, yPosition);
  yPosition += 8;

  const colCabys = margin;
  const colDesc = margin + 28;
  const colCant = margin + contentWidth * 0.52;
  const colPrecio = margin + contentWidth * 0.76;
  const colTotal = margin + contentWidth;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CABYS', colCabys + 2, yPosition + 5.5);
  doc.text('Descripción', colDesc + 2, yPosition + 5.5);
  doc.text('Cant.', colCant, yPosition + 5.5, { align: 'right' });
  doc.text('P. Unit.', colPrecio, yPosition + 5.5, { align: 'right' });
  doc.text('Total', colTotal, yPosition + 5.5, { align: 'right' });
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const item of invoice.items) {
    const descLines = doc.splitTextToSize(item.descripcion, colCant - colDesc - 4);
    const rowHeight = Math.max(descLines.length * 5, 8);

    if (yPosition + rowHeight > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(item.cabysCode, colCabys + 2, yPosition + 5);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(descLines, colDesc + 2, yPosition + 5);
    doc.text(`${item.cantidad} ${item.unidadMedida}`, colCant, yPosition + 5, { align: 'right' });
    doc.text(formatCurrency(item.precioUnitario), colPrecio, yPosition + 5, { align: 'right' });
    doc.text(formatCurrency(item.total), colTotal, yPosition + 5, { align: 'right' });

    yPosition += rowHeight + 2;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPosition - 1, margin + contentWidth, yPosition - 1);
  }

  yPosition += 8;
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal:', colPrecio, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.totalVenta), colTotal, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text('IVA (13%):', colPrecio, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.totalImpuesto), colTotal, yPosition, { align: 'right' });
  yPosition += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', colPrecio, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.totalComprobante), colTotal, yPosition, { align: 'right' });
  yPosition += 16;

  if (yPosition > pageHeight - 30) {
    doc.addPage();
    yPosition = margin;
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('Habita Studio — info@habitastudio.online — +506 6364 4915', margin, pageHeight - 15);

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Versión servidor (Buffer) de la factura simple (sin datos de Hacienda) —
 * para adjuntarla en el email al cliente. Misma disposición que la versión
 * cliente en lib/generate-invoice-pdf.ts.
 */
export async function generateSimpleInvoicePDFBuffer(invoice: SimpleInvoice): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const logo = await loadPdfLogo();
  const logoY = yPosition;
  const logoHeight = drawPdfLogo(doc, logo, { x: margin, y: logoY });

  let companyY = logoY + logoHeight + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Muebles y Remodelaciones de Calidad', margin, companyY);
  companyY += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Costa Rica', margin, companyY);
  doc.text('Email: info@habitastudio.online', margin, companyY + 4);
  doc.text('Tel: +506 6364 4915', margin, companyY + 8);

  const gridGap = 20;
  const leftColWidth = (contentWidth - gridGap) / 2;
  const rightColStart = margin + leftColWidth + gridGap;

  yPosition = companyY + 12 + 10;

  let clientY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENTE', margin, clientY);
  clientY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${invoice.clientName}`, margin, clientY);
  if (invoice.clientEmail) {
    clientY += 6;
    doc.text(`Email: ${invoice.clientEmail}`, margin, clientY);
  }

  let facturaY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', rightColStart + leftColWidth, facturaY, { align: 'right' });
  facturaY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${invoice.numero}`, rightColStart + leftColWidth, facturaY, { align: 'right' });
  facturaY += 6;
  doc.text(
    `Fecha: ${new Date(invoice.fecha).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    rightColStart + leftColWidth,
    facturaY,
    { align: 'right' }
  );

  yPosition = Math.max(clientY, facturaY) + 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DETALLE DE ITEMS', margin, yPosition);
  yPosition += 10;

  const descColStart = margin + 2;
  const descColWidth = 55;
  const cantColStart = descColStart + descColWidth + 8;
  const priceColStart = cantColStart + 15 + 10;
  const priceColWidth = 30;
  const totalColStart = priceColStart + priceColWidth + 15;
  const totalColWidth = 35;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', descColStart, yPosition);
  doc.text('Cant.', cantColStart, yPosition);
  doc.text('Precio Unit.', priceColStart, yPosition);
  doc.text('Total', totalColStart + totalColWidth, yPosition, { align: 'right' });
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  for (const item of invoice.items) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    const descLines = doc.splitTextToSize(item.description, descColWidth);
    doc.text(descLines, descColStart, yPosition);

    const itemHeight = Math.max(descLines.length * 5, 8);
    doc.text(item.quantity.toString(), cantColStart, yPosition);
    doc.text(formatCurrency(item.unitPrice), priceColStart, yPosition);
    doc.text(formatCurrency(item.total), totalColStart + totalColWidth, yPosition, { align: 'right' });

    yPosition += itemHeight + 2;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;
  }

  yPosition += 5;
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }
  const totalsX = pageWidth - margin - 60;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal:', totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin - 2, yPosition, { align: 'right' });

  yPosition += 7;
  const taxPercent = invoice.subtotal > 0 ? ((invoice.tax / invoice.subtotal) * 100).toFixed(2) : '0.00';
  doc.text(`IVA (${taxPercent}%):`, totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.tax), pageWidth - margin - 2, yPosition, { align: 'right' });

  yPosition += 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, yPosition - 2, pageWidth - margin, yPosition - 2);

  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(invoice.total), pageWidth - margin - 2, yPosition, { align: 'right' });

  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este documento es un comprobante de cobro interno y no constituye una factura electrónica ante el Ministerio de Hacienda.',
    pageWidth / 2,
    footerY,
    { align: 'center', maxWidth: contentWidth }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
