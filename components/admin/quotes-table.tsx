"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCRC, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteQuote, updateQuoteStatus, sendQuote } from "@/app/actions/quotes";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Send, Check, X, Eye, Download, MoreVertical } from "lucide-react";
import { generateQuotePDF } from "@/lib/generate-pdf";
import { Pagination } from "@/components/ui/pagination";
import { MobileListItem, InitialsAvatar } from "@/components/admin/mobile-list-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;

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
  clientEmail?: string | null;
  clientPhone?: string | null;
  projectName: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: Date;
  validUntil: Date | null;
  items: QuoteItem[];
}

const statusConfig = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  accepted: { label: "Aceptada", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  rejected: { label: "Rechazada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  expired: { label: "Expirada", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
};

const statusTextColor: Record<string, string> = {
  draft: "text-gray-500 dark:text-gray-400",
  sent: "text-blue-600 dark:text-blue-400",
  accepted: "text-green-600 dark:text-green-400",
  rejected: "text-red-600 dark:text-red-400",
  expired: "text-orange-600 dark:text-orange-400",
};

export function QuotesTable({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [quotes]);

  const totalPages = Math.ceil(quotes.length / ITEMS_PER_PAGE);
  const paginatedQuotes = quotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      const result = await deleteQuote(id);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Cotización eliminada" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar cotización?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  const handleSend = (quote: Quote) => {
    const description = quote.clientEmail
      ? `Enviar cotización ${quote.quoteNumber} a ${quote.clientName} (${quote.clientEmail}) por email y WhatsApp.`
      : "Se enviará por email y se abrirá WhatsApp para compartir el PDF.";

    toast({
      title: "¿Enviar cotización?",
      description,
      action: (
        <ToastAction altText="Confirmar envío" onClick={() => confirmSend(quote.id)}>
          Enviar
        </ToastAction>
      ),
    });
  };

  const confirmSend = async (id: string) => {
    setSending(id);
    try {
      const result = await sendQuote(id);
      await updateQuoteStatus(id, "sent");

      if (result.ok) {
        toast({ title: "Éxito", description: result.message });

        // Si hay URL de WhatsApp, descargar PDF y abrir WhatsApp
        if (result.whatsappUrl && result.pdfBase64 && result.quoteNumber) {
          try {
            const pdfBlob = new Blob(
              [Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))],
              { type: "application/pdf" }
            );
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `cotizacion-${result.quoteNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);

            setTimeout(() => {
              window.open(result.whatsappUrl, "_blank");
              toast({
                title: "WhatsApp abierto",
                description: "El PDF se ha descargado. Por favor adjúntalo manualmente en WhatsApp (botón 📎).",
                duration: 5000,
              });
            }, 800);
          } catch (error) {
            console.error("Error descargando PDF:", error);
            window.open(result.whatsappUrl, "_blank");
            toast({
              title: "WhatsApp abierto",
              description: "Error al descargar PDF. Por favor genera el PDF manualmente y envíalo por WhatsApp.",
              variant: "destructive",
            });
          }

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "draft" | "sent" | "accepted" | "rejected" | "expired") => {
    setUpdatingStatus(id);
    try {
      await updateQuoteStatus(id, newStatus);
      const statusLabels: Record<string, string> = {
        draft: "Borrador",
        sent: "Enviada",
        accepted: "Aceptada",
        rejected: "Rechazada",
        expired: "Expirada",
      };
      toast({ title: "Éxito", description: `Estado actualizado a ${statusLabels[newStatus]}` });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownload = (quote: Quote) => {
    generateQuotePDF(quote);
  };

  const renderActionsMenu = (quote: Quote) => (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admin/quotes/${quote.id}`)}>
            <Eye className="h-4 w-4" />
            Ver
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleDownload(quote)}>
            <Download className="h-4 w-4" />
            Descargar
          </DropdownMenuItem>

          {quote.status !== "accepted" && (
            <DropdownMenuItem
              className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950"
              onClick={() => handleStatusChange(quote.id, "accepted")}
              disabled={updatingStatus === quote.id}
            >
              <Check className="h-4 w-4" />
              Aceptar
            </DropdownMenuItem>
          )}

          {quote.status !== "rejected" && quote.status !== "accepted" && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
              onClick={() => handleStatusChange(quote.id, "rejected")}
              disabled={updatingStatus === quote.id}
            >
              <X className="h-4 w-4" />
              Rechazar
            </DropdownMenuItem>
          )}

          {quote.status === "draft" && (
            <DropdownMenuItem
              className="text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950"
              onClick={() => handleSend(quote)}
              disabled={sending === quote.id}
            >
              <Send className="h-4 w-4" />
              Enviar
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            onClick={() => handleDelete(quote.id)}
            disabled={deleting === quote.id}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 text-center text-muted-foreground">
          <p className="mb-4">No hay cotizaciones aún</p>
          <Button asChild>
            <Link href="/admin/quotes/new">Crear Primera Cotización</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Mobile: lista compacta */}
      <div className="md:hidden">
        {paginatedQuotes.map((quote) => (
          <MobileListItem
            key={quote.id}
            avatar={<InitialsAvatar name={quote.clientName} />}
            title={quote.clientName}
            subtitle={
              <span>
                #{quote.quoteNumber} ·{" "}
                <span className={cn("font-medium", statusTextColor[quote.status])}>
                  {statusConfig[quote.status as keyof typeof statusConfig].label}
                </span>
              </span>
            }
            value={formatCRC(quote.total)}
            valueClassName="text-blue-600 dark:text-blue-400"
            actions={renderActionsMenu(quote)}
          />
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Número</th>
              <th className="text-left py-3 px-4 font-semibold">Cliente</th>
              <th className="text-left py-3 px-4 font-semibold">Estado</th>
              <th className="text-right py-3 px-4 font-semibold">Monto</th>
              <th className="text-right py-3 px-4 font-semibold">Items</th>
              <th className="text-right py-3 px-4 font-semibold">Fecha</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuotes.map((quote) => {
              const status = statusConfig[quote.status as keyof typeof statusConfig];

              return (
                <tr key={quote.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-medium">#{quote.quoteNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{quote.clientName}</p>
                    <p className="text-xs text-muted-foreground">{quote.projectName}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={status.color}>{status.label}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {formatCRC(quote.total)}
                  </td>
                  <td className="py-3 px-4 text-right">{quote.items.length}</td>
                  <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                    {new Date(quote.createdAt).toLocaleDateString("es-CR")}
                  </td>
                  <td className="py-3 px-4">{renderActionsMenu(quote)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </Card>
  );
}
