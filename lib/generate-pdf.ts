import jsPDF from 'jspdf';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  projectName: string;
  projectDescription?: string | null;
  status: string;
  validUntil: Date | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string | null;
  items: QuoteItem[];
  createdAt: Date;
}

export function generateQuotePDF(quote: Quote) {
  const doc = new jsPDF();
  
  // Configuración de márgenes y dimensiones
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Encabezado
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HABITASTUDIO', margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Muebles y Remodelaciones de Calidad', margin, yPosition);
  
  yPosition += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Costa Rica', margin, yPosition);
  doc.text('Email: info@habitastudio.online', margin, yPosition + 5);
  doc.text('Tel: +506 6364 4915', margin, yPosition + 10);
  
  // Título de la cotización
  yPosition += 25;
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${quote.quoteNumber}`, pageWidth - margin, yPosition, { align: 'right' });
  
  yPosition += 6;
  doc.text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-CR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth - margin, yPosition, { align: 'right' });
  
  if (quote.validUntil) {
    yPosition += 6;
    doc.text(`Válida hasta: ${new Date(quote.validUntil).toLocaleDateString('es-CR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth - margin, yPosition, { align: 'right' });
  }
  
  // Información del cliente
  yPosition += 20;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${quote.clientName}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Email: ${quote.clientEmail}`, margin, yPosition);
  if (quote.clientPhone) {
    yPosition += 6;
    doc.text(`Teléfono: ${quote.clientPhone}`, margin, yPosition);
  }
  if (quote.clientAddress) {
    yPosition += 6;
    const addressLines = doc.splitTextToSize(`Dirección: ${quote.clientAddress}`, contentWidth);
    doc.text(addressLines, margin, yPosition);
    yPosition += (addressLines.length - 1) * 6;
  }
  
  // Información del proyecto
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROYECTO', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${quote.projectName}`, margin, yPosition);
  
  if (quote.projectDescription) {
    yPosition += 6;
    const descLines = doc.splitTextToSize(`Descripción: ${quote.projectDescription}`, contentWidth);
    doc.text(descLines, margin, yPosition);
    yPosition += (descLines.length - 1) * 6;
  }
  
  // Tabla de items
  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE ITEMS', margin, yPosition);
  
  yPosition += 10;
  
  // Definir posiciones de columnas con mejor espaciado
  const descColStart = margin + 2;
  const descColWidth = 55;
  const cantColStart = descColStart + descColWidth + 8;
  const cantColWidth = 15;
  const priceColStart = cantColStart + cantColWidth + 10;
  const priceColWidth = 30;
  const totalColStart = priceColStart + priceColWidth + 15;
  const totalColWidth = 35;
  
  // Encabezado de tabla
  const tableTop = yPosition;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción', descColStart, yPosition);
  doc.text('Cant.', cantColStart, yPosition);
  doc.text('Precio Unit.', priceColStart, yPosition);
  doc.text('Total', totalColStart + totalColWidth, yPosition, { align: 'right' });
  
  yPosition += 8;
  
  // Items
  doc.setFont('helvetica', 'normal');
  quote.items.forEach((item) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    
    const descLines = doc.splitTextToSize(item.description, descColWidth);
    doc.text(descLines, descColStart, yPosition);
    
    const itemHeight = Math.max(descLines.length * 5, 8);
    doc.text(item.quantity.toString(), cantColStart, yPosition);
    doc.text(
      formatCurrency(item.unitPrice), 
      priceColStart, 
      yPosition
    );
    doc.text(
      formatCurrency(item.total), 
      totalColStart + totalColWidth, 
      yPosition, 
      { align: 'right' }
    );
    
    yPosition += itemHeight + 2;
    
    // Línea separadora
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;
  });
  
  // Totales
  yPosition += 5;
  const totalsX = pageWidth - margin - 60;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Subtotal:', totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(quote.subtotal), pageWidth - margin - 2, yPosition, { align: 'right' });
  
  yPosition += 7;
  const taxPercent = quote.subtotal > 0 ? ((quote.tax / quote.subtotal) * 100).toFixed(2) : '0.00';
  doc.text(`Impuesto (${taxPercent}%):`, totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(quote.tax), pageWidth - margin - 2, yPosition, { align: 'right' });
  
  if (quote.discount > 0) {
    yPosition += 7;
    doc.setTextColor(0, 128, 0);
    const discountPercent = quote.subtotal > 0 ? ((quote.discount / quote.subtotal) * 100).toFixed(2) : '0.00';
    doc.text(`Descuento (${discountPercent}%):`, totalsX, yPosition, { align: 'right' });
    doc.text(`-${formatCurrency(quote.discount)}`, pageWidth - margin - 2, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  
  yPosition += 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 10, yPosition - 2, pageWidth - margin, yPosition - 2);
  
  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(quote.total), pageWidth - margin - 2, yPosition, { align: 'right' });
  
  // Notas
  if (quote.notes) {
    yPosition += 20;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS ADICIONALES', margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(quote.notes, contentWidth);
    doc.text(notesLines, margin, yPosition);
  }
  
  // Pie de página
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este documento es una cotización y no constituye una orden de compra. Válida por el período indicado.',
    pageWidth / 2,
    footerY,
    { align: 'center', maxWidth: contentWidth }
  );
  
  // Guardar PDF
  doc.save(`cotizacion-${quote.quoteNumber}.pdf`);
}

function formatCurrency(amount: number): string {
  // Formatear número con separadores de miles y decimales
  // Usar formato simple que jsPDF pueda renderizar correctamente
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  // Usar "CRC" o simplemente el símbolo de colón si está disponible
  return `CRC ${formatted}`;
}

