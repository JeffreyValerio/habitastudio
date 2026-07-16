"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCRC } from "@/lib/utils";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { setWorkOrderDeliveryDate } from "@/app/actions/work-orders";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Eye } from "lucide-react";

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  status: string;
  deliveryDate: Date | null;
  createdAt: Date;
  quote: {
    quoteNumber: string;
    clientName: string;
    projectName: string;
    total: number;
    customer: { id: string; name: string } | null;
  };
  spent: number;
  percentUsed: number;
  _count: { timeEntries: number };
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function WorkOrdersGrid({ workOrders }: { workOrders: WorkOrder[] }) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (wo: WorkOrder) => {
    setEditingId(wo.id);
    setDateValue(wo.deliveryDate ? new Date(wo.deliveryDate).toISOString().split("T")[0] : "");
  };

  const saveDeliveryDate = async (id: string) => {
    setSaving(true);
    try {
      const result = await setWorkOrderDeliveryDate(id, dateValue || null);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Éxito",
        description: dateValue ? "Orden liberada al taller" : "Fecha de entrega removida",
      });
      setEditingId(null);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          Aún no hay órdenes de trabajo. Se crean automáticamente al aceptar una cotización.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workOrders.map((wo) => (
        <Card key={wo.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-lg">{wo.workOrderNumber}</p>
                <p className="text-sm font-medium">{wo.quote.customer?.name || wo.quote.clientName}</p>
                <p className="text-xs text-muted-foreground">{wo.quote.projectName}</p>
              </div>
              <Badge className={statusColors[wo.status]}>
                {WORK_ORDER_STATUS_LABELS[wo.status]}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {(() => {
              const over = wo.spent > wo.quote.total;
              return (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-muted-foreground">Presupuesto</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCRC(wo.quote.total)}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Gastado: {formatCRC(wo.spent)}</span>
                      <span>{wo.percentUsed.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/50 dark:bg-black/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${over ? "bg-red-600" : "bg-blue-600"}`}
                        style={{ width: `${wo.percentUsed}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Delivery date */}
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha de compromiso de entrega
              </p>
              {editingId === wo.id ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded-md bg-background text-foreground"
                  />
                  <Button size="sm" onClick={() => saveDeliveryDate(wo.id)} disabled={saving}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(wo)}
                  className="text-sm font-medium hover:underline text-left"
                >
                  {wo.deliveryDate
                    ? new Date(wo.deliveryDate).toLocaleDateString("es-CR")
                    : "Sin liberar — asignar fecha"}
                </button>
              )}
            </div>

            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={`/admin/work-orders/${wo.id}`}>
                <Eye className="mr-2 h-3 w-3" />
                Ver Detalle
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
