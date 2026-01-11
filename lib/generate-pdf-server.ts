import { jsPDF } from 'jspdf';
import sizeOf from 'image-size';
import { readFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  quoteNumber: string;
  clientName: string;
  clientEmail?: string | null;
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
  
  // === LOGO ===
  // Intentar cargar el logo (PNG o SVG) desde varias ubicaciones posibles
  let logoBase64: string | null = null;
  const logoPaths = [
    { name: 'logo.png', type: 'png' },
    { name: 'logo-png.png', type: 'png' },
    { name: 'logo-pdf.png', type: 'png' },
    { name: 'logo-pdf.svg', type: 'svg' },
    { name: 'logo.svg', type: 'svg' },
  ];
  
  for (const logoInfo of logoPaths) {
    try {
      const logoPath = join(process.cwd(), 'public', 'images', logoInfo.name);
      const fileBuffer = await readFile(logoPath);
      
      if (logoInfo.type === 'svg') {
        // Convertir SVG a PNG usando sharp
        const svgContent = fileBuffer.toString('utf-8');
        const pngBuffer = await sharp(Buffer.from(svgContent, 'utf-8'), {
          density: 300,
        })
          .resize({
            width: 1200,
            height: 560,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fondo blanco
          })
          .flatten({ background: { r: 255, g: 255, b: 255 } }) // Asegurar fondo blanco sólido
          .png({
            quality: 100,
            compressionLevel: 6,
          })
          .toBuffer();
        
        const base64 = pngBuffer.toString('base64');
        logoBase64 = `data:image/png;base64,${base64}`;
        console.log(`Logo SVG convertido a PNG desde: ${logoPath}`);
        break;
      } else {
        // Si es PNG, usarlo directamente
        const base64 = fileBuffer.toString('base64');
        logoBase64 = `data:image/png;base64,${base64}`;
        console.log(`Logo PNG cargado desde: ${logoPath}`);
        break;
      }
    } catch (error) {
      // Intentar desde URL pública
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                        'https://habitastudio.online';
        const logoUrl = `${baseUrl}/images/${logoInfo.name}`;
        const response = await fetch(logoUrl);
        if (response.ok) {
          if (logoInfo.type === 'svg') {
            const svgText = await response.text();
            const pngBuffer = await sharp(Buffer.from(svgText, 'utf-8'), {
              density: 300,
            })
              .resize({
                width: 1200,
                height: 560,
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 },
              })
              .flatten({ background: { r: 255, g: 255, b: 255 } })
              .png({
                quality: 100,
                compressionLevel: 6,
              })
              .toBuffer();
            
            const base64 = pngBuffer.toString('base64');
            logoBase64 = `data:image/png;base64,${base64}`;
            console.log(`Logo SVG convertido a PNG desde URL: ${logoUrl}`);
          } else {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            logoBase64 = `data:image/png;base64,${base64}`;
            console.log(`Logo PNG cargado desde URL: ${logoUrl}`);
          }
          break;
        }
      } catch (urlError) {
        console.log(`No se encontró logo en: ${logoInfo.name}`);
      }
    }
  }
  
  const logoWidth = 60;
  let logoHeight = 25; // Altura por defecto
  const logoX = margin;
  const logoY = yPosition;
  
  if (logoBase64) {
    try {
      // Obtener dimensiones de la imagen para mantener proporción
      const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const dimensions = sizeOf(imageBuffer);
      
      if (dimensions.width && dimensions.height) {
        // Calcular altura proporcional basada en el ancho deseado
        const aspectRatio = dimensions.width / dimensions.height;
        logoHeight = logoWidth / aspectRatio; // Usar la altura real calculada
        
        doc.addImage(base64Data, 'PNG', logoX, logoY, logoWidth, logoHeight);
        console.log(`Logo agregado al PDF: ${logoWidth}x${logoHeight}mm (${dimensions.width}x${dimensions.height}px)`);
      } else {
        doc.addImage(base64Data, 'PNG', logoX, logoY, logoWidth, logoHeight);
        console.log(`Logo agregado al PDF con dimensiones por defecto: ${logoWidth}x${logoHeight}mm`);
      }
    } catch (error) {
      console.error('Error agregando logo PNG:', error);
      // Fallback: rectángulo de prueba
      doc.setFillColor(242, 242, 242);
      doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(logoX, logoY, logoWidth, logoHeight, 'S');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('LOGO ERROR', logoX + logoWidth / 2, logoY + logoHeight / 2, { align: 'center' });
    }
  } else {
    // Si no se encuentra el logo, mostrar rectángulo de prueba
    doc.setFillColor(242, 242, 242);
    doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(logoX, logoY, logoWidth, logoHeight, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NO LOGO', logoX + logoWidth / 2, logoY + logoHeight / 2, { align: 'center' });
    console.warn('No se encontró ningún logo PNG en las rutas esperadas');
  }
  
  // Información de la empresa
  const companyInfoX = margin;
  let companyY = logoY + logoHeight + 8;
  
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
  if (quote.clientEmail) {
    clientY += 6;
    doc.text(`Email: ${quote.clientEmail}`, leftColStart, clientY);
  }
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
  
  // Información de garantía, pago y entrega
  yPosition += 20;
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CONDICIONES DE PAGO Y ENTREGA', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Garantía: 12 meses por defecto de fabricación', margin + 3, yPosition);
  yPosition += 6;
  doc.text('• Forma de pago: Adelanto del 50% y 50% al finalizar', margin + 3, yPosition);
  yPosition += 6;
  doc.text('• Tiempo de entrega: 12 días hábiles luego de realizado el adelanto', margin + 3, yPosition);
  
  // Datos bancarios
  yPosition += 12;
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS BANCARIOS', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sinpe Móvil: 63644915', margin + 3, yPosition);
  yPosition += 6;
  doc.text('Cliente: MICHAEL ANDRES VALERIO ANGULO', margin + 3, yPosition);
  yPosition += 6;
  doc.text('Número de cuenta BAC: 944908482', margin + 3, yPosition);
  yPosition += 6;
  doc.text('Número de cuenta IBAN: CR47010200009449084829', margin + 3, yPosition);
  
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

