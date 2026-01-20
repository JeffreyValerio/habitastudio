import jsPDF from 'jspdf';

interface Receipt {
  receiptNumber: string;
  clientName: string;
  clientEmail?: string | null;
  amount: number;
  paymentMethod: string;
  receiptDate: Date;
  concept: string;
  notes?: string | null;
  quoteNumber: string;
  quoteTotal: number;
  balance?: number; // Saldo pendiente después de este recibo
  createdAt: Date;
}


function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `CRC ${formatted}`;
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia bancaria',
    sinpe: 'SINPE Móvil',
    cheque: 'Cheque',
    otro: 'Otro',
  };
  return labels[method] || method;
}

export async function generateReceiptPDF(receipt: Receipt) {
  const doc = new jsPDF();
  
  // Configuración de márgenes y dimensiones
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // === LOGO ===
  // Intentar cargar el logo (PNG o SVG) desde varias ubicaciones posibles
  let logoBase64: string | null = null;
  const logoPaths = ['/images/logo.png', '/images/logo-png.png', '/images/logo-pdf.png', '/images/logo-pdf.svg', '/images/logo.svg'];
  
  for (const logoPath of logoPaths) {
    try {
      const response = await fetch(logoPath);
      if (response.ok) {
        const blob = await response.blob();
        
        // Si es SVG, necesitamos convertirlo a imagen
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
          // Si es PNG, leerlo directamente
          const reader = new FileReader();
          logoBase64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
        console.log(`Logo cargado desde: ${logoPath}`);
        break;
      }
    } catch (error) {
      console.log(`No se encontró logo en: ${logoPath}`);
    }
  }
  
  const logoWidth = 60;
  let logoHeight = 25; // Altura por defecto
  const logoX = margin;
  const logoY = yPosition;
  
  if (logoBase64) {
    try {
      // Obtener dimensiones de la imagen para mantener proporción
      const img = new Image();
      img.src = logoBase64;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Calcular altura proporcional basada en el ancho deseado
      const aspectRatio = img.width / img.height;
      logoHeight = logoWidth / aspectRatio; // Usar la altura real calculada
      
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      console.log(`Logo agregado al PDF: ${logoWidth}x${logoHeight}mm`);
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
  
  yPosition = logoY + logoHeight + 15;
  
  // === INFORMACIÓN DE LA EMPRESA ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RECIBO DE PAGO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  
  // === COLUMNA IZQUIERDA - INFORMACIÓN DEL CLIENTE ===
  let clientY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENTE', margin, clientY);
  
  clientY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${receipt.clientName}`, margin, clientY);
  clientY += 6;
  if (receipt.clientEmail) {
    doc.text(`Email: ${receipt.clientEmail}`, margin, clientY);
    clientY += 6;
  }
  
  // === COLUMNA DERECHA - DATOS DEL RECIBO ===
  let receiptY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL RECIBO', margin + contentWidth, receiptY, { align: 'right' });
  
  receiptY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${receipt.receiptNumber}`, margin + contentWidth, receiptY, { align: 'right' });
  receiptY += 6;
  doc.text(`Fecha: ${new Date(receipt.receiptDate).toLocaleDateString('es-CR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin + contentWidth, receiptY, { align: 'right' });
  receiptY += 6;
  doc.text(`Cotización: ${receipt.quoteNumber}`, margin + contentWidth, receiptY, { align: 'right' });
  
  // Ajustar yPosition para la siguiente sección
  yPosition = Math.max(clientY, receiptY) + 15;
  
  // === DETALLES DEL PAGO ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DEL PAGO', margin, yPosition);
  
  yPosition += 10;
  
  // Tabla de detalles
  const tableStartY = yPosition;
  const rowHeight = 8;
  const col1Width = contentWidth * 0.4;
  const col2Width = contentWidth * 0.6;
  
  // Encabezado de la tabla
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableStartY, contentWidth, rowHeight, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Concepto', margin + 5, tableStartY + 6);
  doc.text('Valor', margin + col1Width + 5, tableStartY + 6);
  
  yPosition = tableStartY + rowHeight;
  
  // Concepto
  doc.setFont('helvetica', 'normal');
  const conceptLines = doc.splitTextToSize(receipt.concept, col1Width - 10);
  doc.text(conceptLines, margin + 5, yPosition + 4);
  
  // Monto
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(receipt.amount), margin + col1Width + 5, yPosition + 4);
  
  // Calcular altura de la fila basada en el concepto
  const conceptHeight = Math.max(conceptLines.length * 6, rowHeight);
  yPosition += conceptHeight + 5;
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, margin + contentWidth, yPosition);
  yPosition += 8;
  
  // Método de pago
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de pago: ${getPaymentMethodLabel(receipt.paymentMethod)}`, margin, yPosition);
  yPosition += 8;
  
  // Total
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${formatCurrency(receipt.amount)}`, margin + contentWidth, yPosition, { align: 'right' });
  
  yPosition += 20;
  
  // === INFORMACIÓN DE LA COTIZACIÓN ===
  if (receipt.quoteTotal) {
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMACIÓN DE LA COTIZACIÓN', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de la cotización ${receipt.quoteNumber}:`, margin, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(receipt.quoteTotal), margin + contentWidth, yPosition, { align: 'right' });
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Monto de este recibo:`, margin, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(receipt.amount), margin + contentWidth, yPosition, { align: 'right' });
    yPosition += 8;
    
    if (receipt.balance !== undefined) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Saldo pendiente:`, margin, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(formatCurrency(receipt.balance), margin + contentWidth, yPosition, { align: 'right' });
      yPosition += 8;
    }
  }
  
  // === NOTAS ===
  if (receipt.notes && receipt.notes.trim()) {
    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NOTAS:', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(receipt.notes, contentWidth);
    doc.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 6 + 10;
  }
  
  // === INFORMACIÓN AL FINAL ===
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const footerInfo = [
    'Datos Bancarias:',
    'Sinpe Móvil: 63644915',
    'Cliente: MICHAEL ANDRES VALERIO ANGULO',
    'Número de cuenta BAC: 944908482',
    'Número de cuenta IBAN: CR47010200009449084829',
  ];
  
  for (const line of footerInfo) {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 6;
  }
  
  // Descargar el PDF
  doc.save(`Recibo-${receipt.receiptNumber}.pdf`);
}
