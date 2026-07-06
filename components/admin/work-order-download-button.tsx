"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateWorkOrderPDF } from "@/lib/generate-work-order-pdf";
import { useToast } from "@/hooks/use-toast";

interface WorkOrderItem {
  description: string;
  quantity: number;
}

interface WorkOrder {
  workOrderNumber: string;
  status: string;
  createdAt: Date;
  deliveryDate: Date | null;
  notes?: string | null;
  images?: string[];
  corteCompletedAt: Date | null;
  encintadoCompletedAt: Date | null;
  armadoCompletedAt: Date | null;
  instaladoCompletedAt: Date | null;
  quote: {
    clientName: string;
    projectName: string;
    customer?: { name: string } | null;
    items: WorkOrderItem[];
  };
}

export function WorkOrderDownloadButton({ workOrder }: { workOrder: WorkOrder }) {
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      await generateWorkOrderPDF({
        workOrderNumber: workOrder.workOrderNumber,
        clientName: workOrder.quote.customer?.name || workOrder.quote.clientName,
        projectName: workOrder.quote.projectName,
        status: workOrder.status,
        createdAt: workOrder.createdAt,
        deliveryDate: workOrder.deliveryDate,
        notes: workOrder.notes,
        items: workOrder.quote.items,
        images: workOrder.images,
        corteCompletedAt: workOrder.corteCompletedAt,
        encintadoCompletedAt: workOrder.encintadoCompletedAt,
        armadoCompletedAt: workOrder.armadoCompletedAt,
        instaladoCompletedAt: workOrder.instaladoCompletedAt,
      });
      toast({ title: "Éxito", description: "PDF generado correctamente" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleDownloadPDF} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      Descargar PDF
    </Button>
  );
}
