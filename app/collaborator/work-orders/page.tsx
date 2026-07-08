import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveWorkOrders } from "@/app/actions/work-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { ClipboardList, Calendar } from "lucide-react";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default async function WorkOrdersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "collaborator") {
    redirect("/admin/login");
  }

  const { allowed } = await getSectionAccess("collaborator.work-orders");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver las órdenes de trabajo." />
      </div>
    );
  }

  const workOrders = await getActiveWorkOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <p className="text-muted-foreground mt-2">
          Órdenes de trabajo activas liberadas al taller
        </p>
      </div>

      {workOrders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Órdenes Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground py-12">
            <p>No hay órdenes de trabajo activas</p>
            <p className="text-sm mt-2">
              Las órdenes de trabajo aparecerán aquí cuando el admin las libere al taller
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <span>Entrega: {new Date(wo.deliveryDate).toLocaleDateString("es-CR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
