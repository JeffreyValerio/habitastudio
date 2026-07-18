"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCRC } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  generateFacturaForWorkOrder,
  sendElectronicDocument,
  checkElectronicDocumentStatus,
  searchCabys,
} from "@/app/actions/electronic-documents";
import { generateInvoicePDF } from "@/lib/generate-invoice-pdf";
import {
  FileText,
  Loader2,
  Search,
  Send,
  RefreshCw,
  Download,
  FileCode,
} from "lucide-react";

interface QuoteItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cabysCode: string | null;
  unidadMedida: string;
}

interface CustomerData {
  identificacionTipo: string | null;
  identificacionNumero: string | null;
}

interface ElectronicDocumentData {
  id: string;
  clave: string;
  consecutivo: string;
  estado: string;
  fechaEmision: Date;
  respuestaXml: string | null;
  xmlFirmado: string;
}

interface EmisorConfigData {
  nombre: string;
  identificacionNumero: string;
}

const TIPOS_IDENTIFICACION = [
  { value: "01", label: "01 - Cédula Física" },
  { value: "02", label: "02 - Cédula Jurídica" },
  { value: "03", label: "03 - DIMEX" },
  { value: "04", label: "04 - NITE" },
  { value: "05", label: "05 - Extranjero No Domiciliado" },
  { value: "06", label: "06 - No Contribuyente" },
];

const ESTADO_LABELS: Record<string, string> = {
  borrador: "Borrador",
  procesando: "Procesando",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  error: "Error",
};

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  procesando: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  aceptado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rechazado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function CabysField({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ codigo: string; descripcion: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      const result = await searchCabys(query);
      setResults(result.ok ? result.results : []);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Código CABYS (13 dígitos)"
          maxLength={13}
          className="font-mono text-sm"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="Buscar por descripción..."
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded-md border text-sm">
          {results.map((r) => (
            <button
              type="button"
              key={r.codigo}
              onClick={() => {
                onChange(r.codigo);
                setResults([]);
                setQuery("");
              }}
              className="block w-full px-2 py-1.5 text-left hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span> {r.descripcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function InvoiceRow({
  workOrder,
  customer,
  items,
  electronicDocument,
  emisorConfig,
}: {
  workOrder: { id: string; workOrderNumber: string; quoteNumber: string; total: number; clientName: string; clientEmail: string | null };
  customer: CustomerData | null;
  items: QuoteItemData[];
  electronicDocument: ElectronicDocumentData | null;
  emisorConfig: EmisorConfigData | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const [identificacionTipo, setIdentificacionTipo] = useState(customer?.identificacionTipo || "02");
  const [identificacionNumero, setIdentificacionNumero] = useState(customer?.identificacionNumero || "");
  const [itemsState, setItemsState] = useState(
    items.map((i) => ({ id: i.id, cabysCode: i.cabysCode || "", unidadMedida: i.unidadMedida || "Unid" }))
  );

  const updateItem = (id: string, field: "cabysCode" | "unidadMedida", value: string) => {
    setItemsState((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateFacturaForWorkOrder(workOrder.id, {
        receptorIdentificacionTipo: identificacionTipo,
        receptorIdentificacionNumero: identificacionNumero,
        items: itemsState,
      });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Factura generada y firmada. Revísala antes de enviarla a Hacienda." });
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!electronicDocument) return;
    setSending(true);
    try {
      const result = await sendElectronicDocument(electronicDocument.id);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Enviado", description: "Factura enviada a Hacienda, procesando..." });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    if (!electronicDocument) return;
    setChecking(true);
    try {
      const result = await checkElectronicDocumentStatus(electronicDocument.id);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Estado actualizado",
        description: `Estado: ${ESTADO_LABELS[result.electronicDocument.estado] || result.electronicDocument.estado}`,
      });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadXml = () => {
    if (!electronicDocument) return;
    downloadTextFile(`Factura-${electronicDocument.consecutivo}.xml`, electronicDocument.xmlFirmado);
  };

  const handleDownloadRespuesta = () => {
    if (!electronicDocument?.respuestaXml) return;
    downloadTextFile(`Respuesta-Hacienda-${electronicDocument.consecutivo}.xml`, electronicDocument.respuestaXml);
  };

  const handleDownloadPdf = async () => {
    if (!electronicDocument || !emisorConfig) return;
    const TARIFA = 13;
    await generateInvoicePDF({
      clave: electronicDocument.clave,
      consecutivo: electronicDocument.consecutivo,
      estado: electronicDocument.estado,
      fechaEmision: electronicDocument.fechaEmision,
      emisorNombre: emisorConfig.nombre,
      emisorIdentificacion: emisorConfig.identificacionNumero,
      receptorNombre: workOrder.clientName,
      receptorIdentificacion: customer?.identificacionNumero || "—",
      receptorEmail: workOrder.clientEmail,
      items: items.map((it) => {
        const subtotal = it.quantity * it.unitPrice;
        const impuesto = subtotal * (TARIFA / 100);
        return {
          descripcion: it.description,
          cabysCode: it.cabysCode || "—",
          cantidad: it.quantity,
          unidadMedida: it.unidadMedida,
          precioUnitario: it.unitPrice,
          subtotal,
          impuesto,
          total: subtotal + impuesto,
        };
      }),
      totalVenta: workOrder.total,
      totalImpuesto: workOrder.total * (TARIFA / 100),
      totalComprobante: workOrder.total * (1 + TARIFA / 100),
    });
  };

  return (
    <tr className="border-b hover:bg-accent/50 align-top">
      <td className="py-3 px-4">
        <p className="font-medium">{workOrder.clientName}</p>
        <Link href={`/admin/work-orders/${workOrder.id}`} className="text-xs text-muted-foreground hover:underline">
          {workOrder.workOrderNumber}
        </Link>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{workOrder.quoteNumber}</td>
      <td className="py-3 px-4 text-right font-mono">{formatCRC(workOrder.total)}</td>
      <td className="py-3 px-4 text-right">
        {electronicDocument ? (
          <Badge className={ESTADO_COLORS[electronicDocument.estado]}>
            {ESTADO_LABELS[electronicDocument.estado] || electronicDocument.estado}
          </Badge>
        ) : (
          <Badge variant="outline">Sin generar</Badge>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!electronicDocument && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Generar Factura
              </Button>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generar Factura Electrónica — {workOrder.workOrderNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tipo de Identificación del Cliente</Label>
                      <Select value={identificacionTipo} onValueChange={setIdentificacionTipo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_IDENTIFICACION.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Número de Identificación</Label>
                      <Input
                        value={identificacionNumero}
                        onChange={(e) => setIdentificacionNumero(e.target.value)}
                        placeholder="Sin guiones"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Ítems — Código CABYS y Unidad de Medida</Label>
                    {items.map((item) => {
                      const state = itemsState.find((s) => s.id === item.id)!;
                      return (
                        <div key={item.id} className="rounded-md border p-3 space-y-2">
                          <p className="text-sm font-medium">
                            {item.description} × {item.quantity} — {formatCRC(item.total)}
                          </p>
                          <CabysField value={state.cabysCode} onChange={(v) => updateItem(item.id, "cabysCode", v)} />
                          <Input
                            value={state.unidadMedida}
                            onChange={(e) => updateItem(item.id, "unidadMedida", e.target.value)}
                            placeholder="Unidad de medida (ej. Unid, Sp)"
                            className="text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating}>
                    {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generar y Firmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {electronicDocument?.estado === "borrador" && (
            <Button size="sm" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar a Hacienda
            </Button>
          )}
          {electronicDocument?.estado === "procesando" && (
            <Button size="sm" variant="outline" onClick={handleCheck} disabled={checking}>
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Consultar Estado
            </Button>
          )}
          {electronicDocument && (
            <>
              <Button size="sm" variant="ghost" onClick={handleDownloadXml} title="Descargar XML firmado">
                <FileCode className="h-4 w-4" />
              </Button>
              {emisorConfig && (
                <Button size="sm" variant="ghost" onClick={handleDownloadPdf} title="Descargar PDF">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {electronicDocument.respuestaXml && (
                <Button size="sm" variant="ghost" onClick={handleDownloadRespuesta} title="Descargar respuesta de Hacienda">
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
        {(electronicDocument?.estado === "rechazado" || electronicDocument?.estado === "error") &&
          electronicDocument.respuestaXml && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-2 max-w-md ml-auto">
              <p className="text-xs font-medium mb-1">Detalle de Hacienda:</p>
              <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground max-h-24 overflow-y-auto">
                {electronicDocument.respuestaXml}
              </pre>
            </div>
          )}
      </td>
    </tr>
  );
}
