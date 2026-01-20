"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateReceiptPDF } from "@/lib/generate-receipt-pdf";
import { getReceiptsByQuote } from "@/app/actions/receipts";

interface Receipt {
  id: string;
  receiptNumber: string;
  clientName: string;
  clientEmail?: string | null;
  amount: number;
  paymentMethod: string;
  receiptDate: Date;
  concept: string;
  notes?: string | null;
  quote: {
    id: string;
    quoteNumber: string;
    total: number;
  };
  createdAt: Date;
}

interface ReceiptDownloadButtonProps {
  receipt: Receipt;
}

export function ReceiptDownloadButton({ receipt }: ReceiptDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      // Calcular saldo pendiente
      const allReceipts = await getReceiptsByQuote(receipt.quote.id);
      const totalPaid = allReceipts
        .filter((r) => r.id !== receipt.id)
        .reduce((sum, r) => sum + r.amount, 0);
      const balance = Math.max(0, receipt.quote.total - totalPaid - receipt.amount);

      await generateReceiptPDF({
        receiptNumber: receipt.receiptNumber,
        clientName: receipt.clientName,
        clientEmail: receipt.clientEmail,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        receiptDate: receipt.receiptDate,
        concept: receipt.concept,
        notes: receipt.notes,
        quoteNumber: receipt.quote.quoteNumber,
        quoteTotal: receipt.quote.total,
        balance,
        createdAt: receipt.createdAt,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4" />
    </Button>
  );
}
