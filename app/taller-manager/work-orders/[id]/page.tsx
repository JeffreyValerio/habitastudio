import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkOrder } from "@/app/actions/work-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { TallerManagerWorkOrderDetailTabs } from "@/components/taller-manager/work-order-detail-tabs";
import { WorkOrderDownloadButton } from "@/components/admin/work-order-download-button";
import { ArrowLeft } from "lucide-react";

export default async function TallerManagerWorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let workOrder;
  try {
    workOrder = await getWorkOrder(id);
  } catch {
    // Orden existe pero aún no ha sido liberada por el admin
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/taller-manager/work-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Órdenes de Trabajo
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            Esta orden aún no ha sido liberada por el administrador
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const personnelCount = new Set(workOrder.timeEntries.map((entry) => entry.user.id)).size;

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
        <WorkOrderDownloadButton workOrder={workOrder} />
      </div>

      <TallerManagerWorkOrderDetailTabs
        workOrder={workOrder}
        totalHours={totalHours}
        personnelCount={personnelCount}
      />
    </div>
  );
}
