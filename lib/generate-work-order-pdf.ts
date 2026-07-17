import jsPDF from 'jspdf';
import { WORK_ORDER_STATUS_LABELS, WORK_ORDER_STAGES } from './work-order-types';

interface WorkOrderItem {
  description: string;
  quantity: number;
}

interface WorkOrder {
  workOrderNumber: string;
  clientName: string;
  projectName: string;
  status: string;
  createdAt: Date;
  deliveryDate: Date | null;
  notes?: string | null;
  items: WorkOrderItem[];
  images?: string[];
  corteCompletedAt: Date | null;
  encintadoCompletedAt: Date | null;
  armadoCompletedAt: Date | null;
  instaladoCompletedAt: Date | null;
  entregadoCompletedAt: Date | null;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Función para convertir URL de imagen a base64 y obtener dimensiones
async function imageUrlToBase64(
  imageUrl: string
): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve({ base64, width: canvas.width, height: canvas.height });
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

export async function generateWorkOrderPDF(workOrder: WorkOrder) {
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
        console.log(`Logo cargado desde: ${logoPath}`);
        break;
      }
    } catch (error) {
      console.log(`No se encontró logo en: ${logoPath}`);
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
    } catch (error) {
      console.error('Error agregando logo:', error);
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
    doc.setFillColor(242, 242, 242);
    doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(logoX, logoY, logoWidth, logoHeight, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NO LOGO', logoX + logoWidth / 2, logoY + logoHeight / 2, { align: 'center' });
    console.warn('No se encontró ningún logo en las rutas esperadas');
  }

  yPosition = logoY + logoHeight + 15;

  // === TÍTULO ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('ORDEN DE TRABAJO', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;

  // === COLUMNA IZQUIERDA - CLIENTE / PROYECTO ===
  let clientY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin, clientY);

  clientY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${workOrder.clientName}`, margin, clientY);
  clientY += 6;
  const projectLines = doc.splitTextToSize(`Proyecto: ${workOrder.projectName}`, contentWidth * 0.45);
  doc.text(projectLines, margin, clientY);
  clientY += (projectLines.length - 1) * 6;

  // === COLUMNA DERECHA - DATOS DE LA ORDEN ===
  let orderY = yPosition;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE TRABAJO', margin + contentWidth, orderY, { align: 'right' });

  orderY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número: ${workOrder.workOrderNumber}`, margin + contentWidth, orderY, { align: 'right' });
  orderY += 6;
  doc.text(`Fecha: ${formatDate(workOrder.createdAt)}`, margin + contentWidth, orderY, { align: 'right' });
  orderY += 6;
  doc.text(
    `Entrega: ${workOrder.deliveryDate ? formatDate(workOrder.deliveryDate) : 'Sin definir'}`,
    margin + contentWidth,
    orderY,
    { align: 'right' }
  );
  orderY += 6;
  doc.text(
    `Estado: ${WORK_ORDER_STATUS_LABELS[workOrder.status] || workOrder.status}`,
    margin + contentWidth,
    orderY,
    { align: 'right' }
  );

  yPosition = Math.max(clientY, orderY) + 15;

  // === ETAPAS DE PRODUCCIÓN ===
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ETAPAS DE PRODUCCIÓN', margin, yPosition);
  yPosition += 10;

  const stageDates: Record<string, Date | null> = {
    corte: workOrder.corteCompletedAt,
    encintado: workOrder.encintadoCompletedAt,
    armado: workOrder.armadoCompletedAt,
    instalado: workOrder.instaladoCompletedAt,
    entregado: workOrder.entregadoCompletedAt,
  };

  doc.setFontSize(10);
  for (const stage of WORK_ORDER_STAGES) {
    const completedAt = stageDates[stage.key];
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${stage.label}:`, margin + 3, yPosition);
    doc.setFont('helvetica', 'normal');
    if (completedAt) {
      doc.setTextColor(0, 100, 0);
      doc.text(`Completado — ${formatDate(completedAt)}`, margin + 40, yPosition);
    } else {
      doc.setTextColor(130, 130, 130);
      doc.text('Pendiente', margin + 40, yPosition);
    }
    doc.setTextColor(0, 0, 0);
    yPosition += 7;
  }

  yPosition += 8;

  // === DETALLE DE ITEMS ===
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTOS', margin, yPosition);
  yPosition += 10;

  const descColStart = margin + 2;
  const descColWidth = contentWidth - 40;
  const cantColStart = margin + contentWidth - 2;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Producto', descColStart, yPosition);
  doc.text('Cant.', cantColStart, yPosition, { align: 'right' });

  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  workOrder.items.forEach((item) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    const descLines = doc.splitTextToSize(item.description, descColWidth);
    doc.text(descLines, descColStart, yPosition);
    doc.text(item.quantity.toString(), cantColStart, yPosition, { align: 'right' });

    const itemHeight = Math.max(descLines.length * 5, 8);
    yPosition += itemHeight + 2;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;
  });

  // === IMÁGENES DE REFERENCIA ===
  if (workOrder.images && workOrder.images.length > 0) {
    doc.addPage();
    yPosition = margin;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('IMÁGENES', margin, yPosition);
    yPosition += 10;

    const maxImageWidth = contentWidth;

    for (let i = 0; i < workOrder.images.length; i++) {
      const imageUrl = workOrder.images[i];
      try {
        // Cada imagen empieza en una página nueva (salvo la primera) para
        // aprovechar todo el alto disponible y verse lo más grande posible.
        if (i > 0) {
          doc.addPage();
          yPosition = margin;
        }
        const maxImageHeight = pageHeight - yPosition - margin;

        const imageData = await imageUrlToBase64(imageUrl);

        if (!imageData) {
          console.warn('No se pudo cargar la imagen:', imageUrl);
          continue;
        }

        const aspectRatio = imageData.width / imageData.height;
        let scaledWidth = maxImageWidth;
        let scaledHeight = maxImageWidth / aspectRatio;

        if (scaledHeight > maxImageHeight) {
          scaledHeight = maxImageHeight;
          scaledWidth = maxImageHeight * aspectRatio;
        }

        const imageX = margin + (maxImageWidth - scaledWidth) / 2;
        doc.addImage(imageData.base64, 'JPEG', imageX, yPosition, scaledWidth, scaledHeight, undefined, 'FAST');
        yPosition += scaledHeight;
      } catch (error) {
        console.error('Error procesando imagen:', imageUrl, error);
      }
    }
  }

  // === NOTAS ===
  if (workOrder.notes && workOrder.notes.trim()) {
    yPosition += 8;
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('NOTAS:', margin, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(workOrder.notes, contentWidth);
    doc.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 6;
  }

  // === PIE DE PÁGINA ===
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Documento interno de producción. Habita Studio.',
    pageWidth / 2,
    footerY,
    { align: 'center', maxWidth: contentWidth }
  );

  doc.save(`orden-de-trabajo-${workOrder.workOrderNumber}.pdf`);
}
