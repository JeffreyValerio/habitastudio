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
  images?: string[];
  items: QuoteItem[];
  createdAt: Date;
}

// Función para convertir SVG a imagen base64
async function svgToBase64(svgPath: string): Promise<string> {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    
    // Crear un canvas para renderizar el SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Configurar dimensiones del canvas (ajustar según el tamaño del logo)
    canvas.width = 253;
    canvas.height = 92;
    
    // Crear una imagen desde el SVG
    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = url;
    });
  } catch (error) {
    console.error('Error converting SVG to base64:', error);
    return '';
  }
}

// Función para convertir URL de imagen a base64
async function imageUrlToBase64(imageUrl: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(base64);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          resolve(null);
        }
      };
      img.onerror = () => {
        console.error('Error loading image:', imageUrl);
        resolve(null);
      };
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error processing image URL:', error);
    return null;
  }
}

export async function generateQuotePDF(quote: Quote) {
  const doc = new jsPDF();
  
  // Configuración de márgenes y dimensiones
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Convertir logo SVG a base64 (con color)
  let logoBase64 = await svgToBase64('/images/logo.svg');
  
  // Si falla la conversión, intentar con el logo webp como fallback
  if (!logoBase64) {
    try {
      const response = await fetch('/images/logo.webp');
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        logoBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Error cargando logo webp:', error);
    }
  }
  
  // === LOGO (100% a la izquierda, con color) ===
  const logoWidth = 50;
  const logoHeight = (logoWidth * 92) / 253; // ~18
  const logoX = margin;
  const logoY = yPosition;
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, logoBase64.includes('data:image/png') ? 'PNG' : 'JPEG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error agregando logo al PDF:', error);
    }
  } else {
    console.warn('No se pudo cargar el logo, continuando sin él');
  }
  
  // === INFORMACIÓN DE LA EMPRESA (debajo del logo) ===
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
  
  // Layout de grid de 2 columnas para cliente y cotización
  const gridGap = 20;
  const leftColWidth = (contentWidth - gridGap) / 2;
  const rightColStart = margin + leftColWidth + gridGap;
  const leftColStart = margin;
  
  // Ajustar yPosition para las secciones de cliente y cotización
  yPosition = companyY + 12 + 10;
  
  // === COLUMNA IZQUIERDA - INFORMACIÓN DEL CLIENTE ===
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
  
  // === COLUMNA DERECHA - DATOS DE LA COTIZACIÓN ===
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
  
  // Ajustar yPosition para la siguiente sección (usar el máximo de ambas columnas)
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
    const imageWidth = contentWidth; // Ancho completo del contenido
    const imageHeight = 80; // Altura fija para mantener proporción
    const imageSpacing = 10; // Espacio entre imágenes

    for (let i = 0; i < quote.images.length; i++) {
      const imageUrl = quote.images[i];
      
      // Verificar si necesitamos una nueva página
      if (yPosition + imageHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Posición de la imagen (centrada en el ancho disponible)
      const imageX = margin;
      const imageY = yPosition;

      try {
        // Convertir imagen a base64
        const imageBase64 = await imageUrlToBase64(imageUrl);
        
        if (imageBase64) {
          // Agregar imagen al PDF
          doc.addImage(
            imageBase64,
            'JPEG',
            imageX,
            imageY,
            imageWidth,
            imageHeight
          );
        } else {
          console.warn('No se pudo cargar la imagen:', imageUrl);
        }
      } catch (error) {
        console.error('Error procesando imagen:', imageUrl, error);
        // Continuar con la siguiente imagen aunque esta falle
      }

      // Avanzar posición para la siguiente imagen
      yPosition += imageHeight + imageSpacing;
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

