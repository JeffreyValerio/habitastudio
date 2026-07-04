"use client";

import { formatCRC } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotePreviewPanelProps {
  clientName?: string;
  projectName?: string;
  items?: QuoteItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  status?: string;
}

export function QuotePreviewPanel({
  clientName = "Cliente",
  projectName = "Proyecto",
  items = [],
  subtotal = 0,
  tax = 0,
  discount = 0,
  total = 0,
  status = "draft",
}: QuotePreviewPanelProps) {
  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-orange-100 text-orange-800",
  };

  const statusLabels: Record<string, string> = {
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
    expired: "Expirada",
  };

  return (
    <Card className="sticky top-0 h-fit">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-base">Vista Previa</CardTitle>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cliente y Proyecto */}
        <div className="space-y-1 border-b pb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Cliente
          </p>
          <p className="text-sm font-medium truncate">{clientName}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase mt-2">
            Proyecto
          </p>
          <p className="text-sm font-medium truncate">{projectName}</p>
        </div>

        {/* Items resumido */}
        {items.length > 0 && (
          <div className="space-y-2 border-b pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Items ({items.length})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto text-xs">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="truncate flex-1">{item.description}</span>
                  <span className="font-mono text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de precios */}
        <div className="space-y-2 border-b pb-3">
          <div className="flex justify-between text-xs">
            <span>Subtotal:</span>
            <span className="font-mono font-medium">{formatCRC(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-xs">
              <span>Impuesto:</span>
              <span className="font-mono font-medium">{formatCRC(tax)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Descuento:</span>
              <span className="font-mono font-medium">-{formatCRC(discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-primary/10 rounded-lg p-3">
          <span className="font-semibold text-sm">Total:</span>
          <span className="text-lg font-bold text-primary">
            {formatCRC(total)}
          </span>
        </div>

        {/* Instrucción */}
        <p className="text-xs text-muted-foreground text-center">
          Actualiza los campos para ver cambios
        </p>
      </CardContent>
    </Card>
  );
}
