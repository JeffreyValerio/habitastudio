import jsPDF from 'jspdf';

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
  estado: string; // borrador, procesando, aceptado, rechazado, error
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

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Sin enviar a Hacienda (borrador)',
  procesando: 'Enviada a Hacienda — procesando',
  aceptado: 'Aceptada por Hacienda',
  rechazado: 'Rechazada por Hacienda',
  error: 'Error al procesar',
};

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `CRC ${formatted}`;
}

export async function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let yPosition = margin;

  // === LOGO ===
  let logoBase64: string | null = null;
  const logoPaths = ['/images/logo.png', '/images/logo-png.png', '/images/logo-pdf.png', '/images/logo-pdf.svg', '/images/logo.svg'];

  for (const logoPath of logoPaths) {
    try {
      const response = await fetch(logoPath);
      if (response.ok) {
        const blob = await response.blob();
        if (logoPath.endsWith('.svg')) {
          const svgText = await response.text();
          const img = new Image();
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          logoBase64 = await new Promise<string>((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 600;
              canvas.height = img.height || 280;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('No se pudo obtener contexto del canvas'));
                return;
              }
              ctx.drawImage(img, 0, 0);
              const base64 = canvas.toDataURL('image/png');
              URL.revokeObjectURL(url);
              resolve(base64);
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('Error cargando SVG'));
            };
            img.src = url;
          });
        } else {
          const reader = new FileReader();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        break;
      }
    } catch {
      // probar la siguiente ruta
    }
  }

  const logoWidth = 60;
  let logoHeight = 25;
  const logoX = margin;
  const logoY = yPosition;

  if (logoBase64) {
    try {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const aspectRatio = img.width / img.height;
      logoHeight = logoWidth / aspectRatio;
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch {
      doc.setFillColor(242, 242, 242);
      doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
    }
  } else {
    doc.setFillColor(242, 242, 242);
    doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
  }

  yPosition = logoY + logoHeight + 10;

  // === TÍTULO Y ESTADO ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(ESTADO_LABELS[invoice.estado] || invoice.estado, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // === CLAVE / CONSECUTIVO ===
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

  // === EMISOR / RECEPTOR ===
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

  // === TABLA DE ÍTEMS ===
  // Los montos en colones ("CRC 207 964,60") son más anchos de lo que parece
  // a 9pt — si Cant./P. Unit./Total quedan muy juntas, el texto right-aligned
  // de una columna se monta sobre el de la siguiente. Se deja suficiente
  // ancho a cada una para el caso de montos grandes.
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

  // === TOTALES ===
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

  // === PIE ===
  if (yPosition > pageHeight - 30) {
    doc.addPage();
    yPosition = margin;
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text('Habita Studio — info@habitastudio.online — +506 6364 4915', margin, pageHeight - 15);

  doc.save(`Factura-${invoice.consecutivo}.pdf`);
}
