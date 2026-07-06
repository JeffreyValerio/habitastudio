import Link from "next/link";
import { getActiveWorkOrders } from "@/app/actions/work-orders";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { Calendar, Eye } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function TallerManagerWorkOrdersPage() {
  const workOrders = await getActiveWorkOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo Activas</h1>
        <p className="text-muted-foreground mt-2">
          Órdenes de trabajo liberadas al taller
        </p>
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            No hay órdenes de trabajo activas por el momento
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workOrders.map((wo: any) => (
            <Card key={wo.id}>
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
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {wo.deliveryDate
                      ? `Entrega: ${new Date(wo.deliveryDate).toLocaleDateString("es-CR")}`
                      : "Sin liberar todavía"}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/taller-manager/work-orders/${wo.id}`}>
                    <Eye className="mr-2 h-3 w-3" />
                    Ver Detalle
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
