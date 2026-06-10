"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteReceipt, sendReceipt } from "@/app/actions/receipts";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Send, Download, Search, X as XIcon } from "lucide-react";
import { ReceiptDownloadButton } from "./receipt-download-button";
import { Pagination } from "@/components/ui/pagination";

interface Receipt {
  id: string;
  receiptNumber: string;
  clientName: string;
  clientEmail?: string | null;
  amount: number;
  paymentMethod: string;
  receiptDate: Date;
  concept: string;
  createdAt: Date;
  quote: {
    id: string;
    quoteNumber: string;
    total: number;
  };
}

interface ReceiptWithBalance extends Receipt {
  totalPaid?: number;
  balance?: number;
  isPaid?: boolean;
}

const paymentMethodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  sinpe: "SINPE",
  cheque: "Cheque",
  otro: "Otro",
};

const ITEMS_PER_PAGE = 10;

export function ReceiptsTable({ receipts }: { receipts: Receipt[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular el total pagado por cotización
  const receiptsByQuote = useMemo(() => {
    const map = new Map<string, number>();
    receipts.forEach((receipt) => {
      const current = map.get(receipt.quote.id) || 0;
      map.set(receipt.quote.id, current + receipt.amount);
    });
    return map;
  }, [receipts]);

  // Enriquecer recibos con información de saldo
  const enrichedReceipts = useMemo(() => {
    return receipts.map((receipt) => {
      const totalPaid = receiptsByQuote.get(receipt.quote.id) || 0;
      const balance = receipt.quote.total - totalPaid;
      const isPaid = balance <= 0;
      return {
        ...receipt,
        totalPaid,
        balance: Math.max(0, balance),
        isPaid,
      };
    });
  }, [receipts, receiptsByQuote]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este recibo?")) {
      return;
    }

    setDeleting(id);
    try {
      await deleteReceipt(id);
      toast({
        title: "Éxito",
        description: "Recibo eliminado correctamente",
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el recibo",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSend = async (id: string) => {
    const receipt = receipts.find((r) => r.id === id);
    
    const confirmMessage = receipt
      ? `¿Estás seguro de que deseas enviar el recibo ${receipt.receiptNumber} a ${receipt.clientName} (${receipt.clientEmail})?\n\nSe enviará por email y se abrirá WhatsApp para compartir el PDF.`
      : '¿Estás seguro de que deseas enviar este recibo?\n\nSe enviará por email y se abrirá WhatsApp para compartir el PDF.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setSending(id);
    try {
      const result = await sendReceipt(id);
      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message,
        });

        // Si hay URL de WhatsApp, descargar PDF y abrir WhatsApp
        if (result.whatsappUrl && result.pdfBase64 && result.receiptNumber) {
          // Descargar PDF primero
          try {
            const pdfBlob = new Blob(
              [Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))],
              { type: 'application/pdf' }
            );
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `recibo-${result.receiptNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);

            // Esperar un momento para que se complete la descarga y luego abrir WhatsApp
            setTimeout(() => {
              window.open(result.whatsappUrl, '_blank');
              toast({
                title: "WhatsApp abierto",
                description: "El PDF se ha descargado. Por favor adjúntalo manualmente en WhatsApp (botón 📎).",
                duration: 5000,
              });
            }, 800);
          } catch (error) {
            console.error('Error descargando PDF:', error);
            // Abrir WhatsApp de todas formas
            window.open(result.whatsappUrl, '_blank');
            toast({
              title: "WhatsApp abierto",
              description: "Error al descargar PDF. Por favor genera el PDF manualmente y envíalo por WhatsApp.",
              variant: "destructive",
            });
          }
          
          // Recargar después de un delay mayor para dar tiempo a descargar
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          // Si no hay WhatsApp, recargar normalmente
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al enviar el recibo",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return enrichedReceipts;

    const query = searchQuery.toLowerCase();
    return enrichedReceipts.filter(
      (receipt) =>
        receipt.receiptNumber.toLowerCase().includes(query) ||
        receipt.clientName.toLowerCase().includes(query) ||
        receipt.clientEmail?.toLowerCase().includes(query) ||
        receipt.quote.quoteNumber.toLowerCase().includes(query) ||
        receipt.concept.toLowerCase().includes(query)
    );
  }, [enrichedReceipts, searchQuery]);

  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReceipts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReceipts, currentPage]);


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recibos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Cotización</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead>Estado de Pago</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {searchQuery ? "No se encontraron recibos" : "No hay recibos"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">
                    {receipt.receiptNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{receipt.clientName}</div>
                      {receipt.clientEmail && (
                        <div className="text-sm text-muted-foreground">
                          {receipt.clientEmail}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/quotes/${receipt.quote.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {receipt.quote.quoteNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCRC(receipt.amount)}
                  </TableCell>
                  <TableCell>
                    {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
                  </TableCell>
                  <TableCell>
                    {receipt.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Pagado Completo
                      </span>
                    ) : (
                      <span className="text-sm text-amber-600 font-medium">
                        Saldo: {formatCRC(receipt.balance || 0)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(receipt.receiptDate).toLocaleDateString("es-CR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ReceiptDownloadButton receipt={receipt} />
                      {receipt.clientEmail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSend(receipt.id)}
                          disabled={sending === receipt.id}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/receipts/${receipt.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(receipt.id)}
                        disabled={deleting === receipt.id}
                      >
                        {deleting === receipt.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
