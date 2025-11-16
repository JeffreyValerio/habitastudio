"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateQuotePDF } from "@/lib/generate-pdf";
import { useToast } from "@/hooks/use-toast";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  projectName: string;
  projectDescription?: string | null;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string | null;
  createdAt: Date;
  validUntil: Date | null;
  items: QuoteItem[];
}

export function QuoteDownloadButton({ quote }: { quote: Quote }) {
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    try {
      generateQuotePDF(quote);
      toast({
        title: "Éxito",
        description: "PDF generado correctamente",
      });
    } catch (error: any) {
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

