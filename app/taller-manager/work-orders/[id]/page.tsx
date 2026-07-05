import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkOrder } from "@/app/actions/work-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WORK_ORDER_STATUS_LABELS, WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { WorkOrderControls } from "@/components/admin/work-order-controls";
import { ArrowLeft } from "lucide-react";

export default async function TallerManagerWorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workOrder = await getWorkOrder(id);

  if (!workOrder) {
    notFound();
  }

  const totalHours = workOrder.timeEntries.reduce((sum, entry) => {
    if (entry.exitTime) {
      const diff = new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/taller-manager/work-orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Órdenes de Trabajo
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{workOrder.workOrderNumber}</h1>
            <Badge>{WORK_ORDER_STATUS_LABELS[workOrder.status]}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {workOrder.quote.customer?.name || workOrder.quote.clientName} — {workOrder.quote.projectName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderControls
            workOrderId={workOrder.id}
            status={workOrder.status}
            deliveryDate={workOrder.deliveryDate}
            canEditDeliveryDate={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ítems de la Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workOrder.quote.items.map((item) => (
              <div key={item.id} className="text-sm border-b pb-2">
                {item.description} × {item.quantity}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrder.timeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin registros de tiempo aún</p>
          ) : (
            <div className="space-y-3">
              {workOrder.timeEntries.map((entry) => {
                let hours = 0;
                if (entry.exitTime) {
                  hours = (new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime()) / (1000 * 60 * 60);
                }
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                    <div>
                      <p className="font-medium">{entry.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.entryDate).toLocaleDateString("es-CR")}
                        {entry.workType && ` · ${WORK_ORDER_TYPE_LABELS[entry.workType] || entry.workType}`}
                      </p>
                    </div>
                    <p className="font-semibold">{entry.exitTime ? `${hours.toFixed(1)}h` : "Activo"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
