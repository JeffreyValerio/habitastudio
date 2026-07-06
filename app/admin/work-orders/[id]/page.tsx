import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkOrder } from "@/app/actions/work-orders";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { calculateLaborCost, calculateExpensesCost } from "@/lib/work-order-costs";
import { WorkOrderDetailTabs } from "@/components/admin/work-order-detail-tabs";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { ArrowLeft } from "lucide-react";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/admin/work-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Órdenes de Trabajo
          </Link>
        </Button>
        <RestrictedAccess message="Solo los administradores pueden ver las órdenes de trabajo." />
      </div>
    );
  }

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

  const personnelCount = new Set(workOrder.timeEntries.map((entry) => entry.user.id)).size;

  const budget = workOrder.quote.total;
  const laborCost = await calculateLaborCost(workOrder.timeEntries);
  const expensesCost = calculateExpensesCost(workOrder.expenses);
  const materialsCost = workOrder.expenses
    .filter((e) => e.category === "materiales")
    .reduce((sum, e) => sum + e.amount, 0);
  const otherExpensesCost = expensesCost - materialsCost;
  const totalSpent = laborCost + expensesCost;
  const margin = budget - totalSpent;
  const percentUsed = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const isOverBudget = totalSpent > budget;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/admin/work-orders">
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
        <Button variant="outline" asChild>
          <Link href={`/admin/quotes/${workOrder.quoteId}`}>Ver Cotización {workOrder.quote.quoteNumber}</Link>
        </Button>
      </div>

      <WorkOrderDetailTabs
        workOrder={workOrder}
        budget={budget}
        laborCost={laborCost}
        materialsCost={materialsCost}
        otherExpensesCost={otherExpensesCost}
        totalSpent={totalSpent}
        margin={margin}
        percentUsed={percentUsed}
        isOverBudget={isOverBudget}
        totalHours={totalHours}
        personnelCount={personnelCount}
      />
    </div>
  );
}
