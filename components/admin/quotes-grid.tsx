"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deleteQuote, updateQuoteStatus, sendQuote } from "@/app/actions/quotes";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Send, Check, X, Eye, Download, MoreVertical } from "lucide-react";
import { generateQuotePDF } from "@/lib/generate-pdf";

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

export function QuotesGrid({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quotes.map((quote) => {
        const status = statusConfig[quote.status as keyof typeof statusConfig];

        return (
          <Card key={quote.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-lg">#{quote.quoteNumber}</p>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <p className="font-semibold text-sm">{quote.clientName}</p>
                  <p className="text-xs text-muted-foreground">{quote.projectName}</p>
                </div>

                {/* Menu Button */}
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setOpenMenu(openMenu === quote.id ? null : quote.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  {/* Dropdown Menu */}
                  {openMenu === quote.id && (
                    <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-md z-50 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
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

                      {/* Status Change Options */}
                      {quote.status !== "accepted" && (
                        <>
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
                        </>
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
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Amount */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCRC(quote.total)}
                </p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Items</p>
                  <p className="font-semibold">{quote.items.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-semibold">
                    {new Date(quote.createdAt).toLocaleDateString("es-CR")}
                  </p>
                </div>
                {quote.clientEmail && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="text-xs break-all">{quote.clientEmail}</p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
