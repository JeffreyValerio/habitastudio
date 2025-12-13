"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { deleteQuote, updateQuoteStatus, sendQuote } from "@/app/actions/quotes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Send, Check, X, Clock, Download, Search, X as XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateQuotePDF } from "@/lib/generate-pdf";
import { Pagination } from "@/components/ui/pagination";

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

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-orange-500",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const ITEMS_PER_PAGE = 10;

export function QuotesTable({ quotes }: { quotes: Quote[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
      return;
    }

    setDeleting(id);
    try {
      await deleteQuote(id);
      toast({
        title: "Éxito",
        description: "Cotización eliminada correctamente",
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la cotización",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSend = async (id: string) => {
    // Buscar la cotización para mostrar información en la confirmación
    const quote = quotes.find((q) => q.id === id);
    
    // Mensaje de confirmación
    const confirmMessage = quote
      ? `¿Estás seguro de que deseas enviar la cotización ${quote.quoteNumber} a ${quote.clientName} (${quote.clientEmail})?\n\nSe enviará por email y se abrirá WhatsApp para compartir el PDF.`
      : '¿Estás seguro de que deseas enviar esta cotización?\n\nSe enviará por email y se abrirá WhatsApp para compartir el PDF.';
    
    if (!confirm(confirmMessage)) {
      return; // El usuario canceló
    }

    setSending(id);
    try {
      const result = await sendQuote(id);
      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message,
        });

        // Si hay URL de WhatsApp, descargar PDF y abrir WhatsApp
        if (result.whatsappUrl && result.pdfBase64 && result.quoteNumber) {
          // Descargar PDF primero
          try {
            const pdfBlob = new Blob(
              [Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))],
              { type: 'application/pdf' }
            );
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `cotizacion-${result.quoteNumber}.pdf`;
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
        description: "Error al enviar la cotización",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const result = await updateQuoteStatus(id, status);
      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        window.location.reload();
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
        description: "Error al actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      await generateQuotePDF(quote);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-CR");
  };

  const filteredQuotes = useMemo(() => {
    if (!searchQuery.trim()) return quotes;
    
    const query = searchQuery.toLowerCase().trim();
    return quotes.filter(
      (quote) =>
        quote.quoteNumber.toLowerCase().includes(query) ||
        quote.clientName.toLowerCase().includes(query) ||
        quote.clientEmail.toLowerCase().includes(query) ||
        quote.projectName.toLowerCase().includes(query) ||
        quote.status.toLowerCase().includes(query)
    );
  }, [quotes, searchQuery]);

  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredQuotes.slice(startIndex, endIndex);
  }, [filteredQuotes, currentPage]);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cotizaciones aún.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/quotes/new">Crear primera cotización</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número, cliente, proyecto..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => handleSearchChange("")}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredQuotes.length} resultado{filteredQuotes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Válida hasta</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedQuotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{quote.clientName}</div>
                  <div className="text-sm text-muted-foreground">{quote.clientEmail}</div>
                </div>
              </TableCell>
              <TableCell>{quote.projectName}</TableCell>
              <TableCell>
                <Badge className={statusColors[quote.status] || "bg-gray-500"}>
                  {statusLabels[quote.status] || quote.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(quote.total)}</TableCell>
              <TableCell>{formatDate(quote.validUntil)}</TableCell>
              <TableCell>{formatDate(quote.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {quote.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSend(quote.id)}
                      disabled={sending === quote.id}
                      title="Enviar cotización"
                    >
                      <Send className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  {quote.status === "sent" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusChange(quote.id, "accepted")}
                        title="Marcar como aceptada"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusChange(quote.id, "rejected")}
                        title="Marcar como rechazada"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownloadPDF(quote)}
                    title="Descargar PDF"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/quotes/${quote.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(quote.id)}
                    disabled={deleting === quote.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
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

