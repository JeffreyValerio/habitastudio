import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkOrder } from "@/app/actions/work-orders";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCRC } from "@/lib/utils";
import { WORK_ORDER_STATUS_LABELS, WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { calculateLaborCost, calculateExpensesCost } from "@/lib/work-order-costs";
import { WorkOrderControls } from "@/components/admin/work-order-controls";
import { WorkOrderExpenses } from "@/components/admin/work-order-expenses";
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Cotizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCRC(workOrder.quote.total)}</p>
          </CardContent>
        </Card>
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
          <CardTitle>Presupuesto vs. Gastos Reales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Presupuesto</p>
              <p className="text-lg font-bold">{formatCRC(budget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mano de Obra</p>
              <p className="text-lg font-bold">{formatCRC(laborCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Materiales</p>
              <p className="text-lg font-bold">{formatCRC(materialsCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Otros Gastos</p>
              <p className="text-lg font-bold">{formatCRC(otherExpensesCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margen</p>
              <p className={`text-lg font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCRC(margin)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Gastado: {formatCRC(totalSpent)}</span>
              <span>{percentUsed.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${isOverBudget ? "bg-red-600" : "bg-primary"}`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-xs text-red-600 mt-1">
                Esta orden superó el presupuesto de la cotización
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liberación y Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderControls
            workOrderId={workOrder.id}
            status={workOrder.status}
            deliveryDate={workOrder.deliveryDate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkOrderExpenses workOrderId={workOrder.id} expenses={workOrder.expenses} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ítems de la Cotización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workOrder.quote.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                <span>{item.description} × {item.quantity}</span>
                <span className="font-medium">{formatCRC(item.total)}</span>
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
