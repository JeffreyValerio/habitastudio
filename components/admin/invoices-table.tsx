"use client";

import { Card, CardContent } from "@/components/ui/card";
import { InvoiceRow } from "@/components/admin/invoice-row";

interface QuoteItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cabysCode: string | null;
  unidadMedida: string;
}

interface WorkOrderForInvoicing {
  id: string;
  workOrderNumber: string;
  quote: {
    quoteNumber: string;
    total: number;
    clientName: string;
    clientEmail: string | null;
    customer: {
      name: string;
      email: string;
      identificacionTipo: string | null;
      identificacionNumero: string | null;
    } | null;
    items: QuoteItemData[];
  };
  electronicDocument: {
    id: string;
    clave: string;
    consecutivo: string;
    estado: string;
    fechaEmision: Date;
    respuestaXml: string | null;
    xmlFirmado: string;
  } | null;
}

interface EmisorConfigData {
  nombre: string;
  identificacionNumero: string;
}

export function InvoicesTable({
  workOrders,
  emisorConfig,
}: {
  workOrders: WorkOrderForInvoicing[];
  emisorConfig: EmisorConfigData | null;
}) {
  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          No hay órdenes de trabajo entregadas todavía. Las facturas se generan aquí una vez una OT llega a la etapa
          "Entregado".
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
              <th className="text-left py-3 px-4 font-semibold">Cliente / OT</th>
              <th className="text-left py-3 px-4 font-semibold">Cotización</th>
              <th className="text-right py-3 px-4 font-semibold">Monto</th>
              <th className="text-right py-3 px-4 font-semibold">Estado</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((wo) => (
              <InvoiceRow
                key={wo.id}
                workOrder={{
                  id: wo.id,
                  workOrderNumber: wo.workOrderNumber,
                  quoteNumber: wo.quote.quoteNumber,
                  total: wo.quote.total,
                  clientName: wo.quote.customer?.name || wo.quote.clientName,
                  clientEmail: wo.quote.customer?.email || wo.quote.clientEmail,
                }}
                customer={wo.quote.customer}
                items={wo.quote.items}
                electronicDocument={wo.electronicDocument}
                emisorConfig={emisorConfig}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
