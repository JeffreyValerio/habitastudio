import { jsPDF } from 'jspdf';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
  images?: string[];
  items: QuoteItem[];
  createdAt: Date;
}

// Función para cargar el logo en el servidor
async function loadLogo(): Promise<string | null> {
  try {
    // Intentar leer el logo directamente desde el sistema de archivos
    try {
      const publicPath = join(process.cwd(), 'public', 'images', 'logo.svg');
      const svgBuffer = await readFile(publicPath);
      
      // Convertir SVG a PNG usando sharp
      const pngBuffer = await sharp(svgBuffer)
        .resize(253, 92, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      
      const base64 = pngBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (fsError) {
      console.warn('No se pudo leer el logo del sistema de archivos, intentando desde URL:', fsError);
    }

    // Fallback: Intentar cargar desde URL pública
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    'https://habitastudio.online';
    
    // Intentar cargar el logo SVG y convertirlo
    const svgUrl = `${baseUrl}/images/logo.svg`;
    const svgResponse = await fetch(svgUrl);
    if (svgResponse.ok) {
      const svgBuffer = Buffer.from(await svgResponse.arrayBuffer());
      
      // Convertir SVG a PNG usando sharp
      const pngBuffer = await sharp(svgBuffer)
        .resize(253, 92, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      
      const base64 = pngBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }

    // Intentar PNG directamente
    const pngUrl = `${baseUrl}/images/logo.png`;
    const pngResponse = await fetch(pngUrl);
    if (pngResponse.ok) {
      const arrayBuffer = await pngResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }

    console.warn('No se pudo cargar el logo desde ninguna fuente');
    return null;
  } catch (error) {
    console.error('Error cargando logo:', error);
    return null;
  }
}

// Función para convertir URL de imagen a base64 en el servidor
async function imageUrlToBase64(
  imageUrl: string
): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    // Descargar la imagen
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Error al descargar imagen:', imageUrl);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Obtener dimensiones de la imagen
    let width = 800;
    let height = 600;
    
    try {
      const dimensions = sizeOf(buffer);
      if (dimensions.width && dimensions.height) {
        width = dimensions.width;
        height = dimensions.height;
      }
    } catch (sizeError) {
      console.warn('No se pudieron obtener dimensiones de la imagen, usando valores por defecto:', imageUrl);
    }
    
    // Convertir a base64
    const base64 = buffer.toString('base64');
    
    // Determinar el tipo de imagen
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return {
      base64: dataUrl,
      width,
      height,
    };
  } catch (error) {
    console.error('Error procesando imagen:', imageUrl, error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `CRC ${formatted}`;
}

export async function generateQuotePDFBuffer(quote: Quote): Promise<Buffer> {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Convertir logo SVG a base64
  let logoBase64 = await loadLogo();
  
  // === LOGO (100% a la izquierda, con color) ===
  const logoWidth = 50;
  const logoHeight = (logoWidth * 92) / 253; // ~18
  const logoX = margin;
  const logoY = yPosition;
  
  if (logoBase64) {
    try {
      // El logo ya está convertido a PNG, así que usamos PNG directamente
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error agregando logo al PDF:', error);
    }
  } else {
    console.warn('No se pudo cargar el logo, continuando sin él');
  }
  
  yPosition = logoY + logoHeight + 8;
  
  // Información de la empresa
  const companyInfoX = margin;
  let companyY = yPosition;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Muebles y Remodelaciones de Calidad', companyInfoX, companyY);
  
  companyY += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Costa Rica', companyInfoX, companyY);
  doc.text('Email: info@habitastudio.online', companyInfoX, companyY + 4);
  doc.text('Tel: +506 6364 4915', companyInfoX, companyY + 8);
  
  // Layout de grid de 2 columnas
  const gridGap = 20;
  const leftColWidth = (contentWidth - gridGap) / 2;
  const rightColStart = margin + leftColWidth + gridGap;
  const leftColStart = margin;
  
  yPosition = companyY + 12 + 10;
  
  // Columna izquierda - Cliente
  let clientY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENTE', leftColStart, clientY);
  
  clientY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${quote.clientName}`, leftColStart, clientY);
  clientY += 6;
  doc.text(`Email: ${quote.clientEmail}`, leftColStart, clientY);
  if (quote.clientPhone) {
    clientY += 6;
    doc.text(`Teléfono: ${quote.clientPhone}`, leftColStart, clientY);
  }
  if (quote.clientAddress) {
    clientY += 6;
    const addressLines = doc.splitTextToSize(`Dirección: ${quote.clientAddress}`, leftColWidth);
    doc.text(addressLines, leftColStart, clientY);
    clientY += (addressLines.length - 1) * 6;
  }
  
  // Columna derecha - Cotización
  let quoteY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', rightColStart + leftColWidth, quoteY, { align: 'right' });
  
  quoteY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${quote.quoteNumber}`, rightColStart + leftColWidth, quoteY, { align: 'right' });
  
  quoteY += 6;
  doc.text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-CR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, rightColStart + leftColWidth, quoteY, { align: 'right' });
  
  if (quote.validUntil) {
    quoteY += 6;
    doc.text(`Válida hasta: ${new Date(quote.validUntil).toLocaleDateString('es-CR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, rightColStart + leftColWidth, quoteY, { align: 'right' });
  }
  
  yPosition = Math.max(clientY, quoteY) + 10;
  
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
  
  const descColStart = margin + 2;
  const descColWidth = 55;
  const cantColStart = descColStart + descColWidth + 8;
  const cantColWidth = 15;
  const priceColStart = cantColStart + cantColWidth + 10;
  const priceColWidth = 30;
  const totalColStart = priceColStart + priceColWidth + 15;
  const totalColWidth = 35;
  
  // Encabezado de tabla
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
    yPosition += (notesLines.length * 6) + 10;
  }

  // Imágenes de referencia
  if (quote.images && quote.images.length > 0) {
    yPosition += 20;
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Diseño', margin, yPosition);
    yPosition += 10;

    // Configuración para las imágenes - una sola columna
    const maxImageWidth = contentWidth; // Ancho máximo disponible
    const maxImageHeight = 120; // Altura máxima por imagen
    const imageSpacing = 10; // Espacio entre imágenes

    for (let i = 0; i < quote.images.length; i++) {
      const imageUrl = quote.images[i];

      try {
        // Convertir imagen a base64 y obtener dimensiones originales
        const imageData = await imageUrlToBase64(imageUrl);
        
        if (!imageData) {
          console.warn('No se pudo cargar la imagen:', imageUrl);
          continue;
        }

        // Obtener dimensiones originales
        const originalWidth = imageData.width;
        const originalHeight = imageData.height;
        const aspectRatio = originalWidth / originalHeight;

        // Calcular dimensiones escaladas manteniendo la proporción original
        let scaledWidth = maxImageWidth;
        let scaledHeight = maxImageWidth / aspectRatio;

        // Si la altura escalada excede el máximo, ajustar por altura
        if (scaledHeight > maxImageHeight) {
          scaledHeight = maxImageHeight;
          scaledWidth = maxImageHeight * aspectRatio;
        }

        // Verificar si necesitamos una nueva página
        if (yPosition + scaledHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Posición de la imagen
        const imageX = margin;
        const imageY = yPosition;

        // Agregar imagen al PDF
        doc.addImage(
          imageData.base64,
          'JPEG',
          imageX,
          imageY,
          scaledWidth,
          scaledHeight,
          undefined,
          'FAST'
        );

        // Avanzar posición para la siguiente imagen
        yPosition += scaledHeight + imageSpacing;
      } catch (error) {
        console.error('Error procesando imagen:', imageUrl, error);
        // Continuar con la siguiente imagen aunque esta falle
      }
    }
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
  
  // Convertir a buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

