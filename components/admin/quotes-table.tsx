"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteQuote, updateQuoteStatus, sendQuote } from "@/app/actions/quotes";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Send, Check, X, Eye, Download, MoreVertical } from "lucide-react";
import { generateQuotePDF } from "@/lib/generate-pdf";
import { Pagination } from "@/components/ui/pagination";

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

export function QuotesTable({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenu]);

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
      await deleteQuote(id);
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

  const handleSend = async (quote: Quote) => {
    setSending(quote.id);
    try {
      await sendQuote(quote.id);
      await updateQuoteStatus(quote.id, "sent");
      toast({ title: "Éxito", description: "Cotización enviada por email" });
      window.location.reload();
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
      <div className="overflow-x-auto">
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
                  <td className="py-3 px-4">
                    <div className="relative flex justify-end" ref={openMenu === quote.id ? menuRef : undefined}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setOpenMenu(openMenu === quote.id ? null : quote.id)}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {openMenu === quote.id && (
                        <div
                          className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-md z-50 min-w-[160px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 border-b"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/admin/quotes/${quote.id}`);
                              setOpenMenu(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </button>

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 border-b"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDownload(quote);
                              setOpenMenu(null);
                            }}
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </button>

                          {quote.status !== "accepted" && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-950 flex items-center gap-2 border-b text-green-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStatusChange(quote.id, "accepted");
                                setOpenMenu(null);
                              }}
                              disabled={updatingStatus === quote.id}
                            >
                              <Check className="h-4 w-4" />
                              Aceptar
                            </button>
                          )}

                          {quote.status !== "rejected" && quote.status !== "accepted" && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 border-b text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleStatusChange(quote.id, "rejected");
                                setOpenMenu(null);
                              }}
                              disabled={updatingStatus === quote.id}
                            >
                              <X className="h-4 w-4" />
                              Rechazar
                            </button>
                          )}

                          {quote.status === "draft" && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center gap-2 border-b text-blue-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSend(quote);
                                setOpenMenu(null);
                              }}
                              disabled={sending === quote.id}
                            >
                              <Send className="h-4 w-4" />
                              Enviar
                            </button>
                          )}

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 text-red-600"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(quote.id);
                              setOpenMenu(null);
                            }}
                            disabled={deleting === quote.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
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
