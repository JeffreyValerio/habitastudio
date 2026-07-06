"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";
import { WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { WorkOrderControls } from "@/components/admin/work-order-controls";
import { WorkOrderExpenses } from "@/components/admin/work-order-expenses";
import { WorkOrderImages } from "@/components/admin/work-order-images";
import type { getWorkOrder } from "@/app/actions/work-orders";

type WorkOrderData = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

type Tab = "general" | "gastos" | "imagenes" | "historial";

export function WorkOrderDetailTabs({
  workOrder,
  budget,
  laborCost,
  materialsCost,
  otherExpensesCost,
  totalSpent,
  margin,
  percentUsed,
  isOverBudget,
  totalHours,
}: {
  workOrder: WorkOrderData;
  budget: number;
  laborCost: number;
  materialsCost: number;
  otherExpensesCost: number;
  totalSpent: number;
  margin: number;
  percentUsed: number;
  isOverBudget: boolean;
  totalHours: number;
}) {
  const [tab, setTab] = useState<Tab>("general");

  const TabButton = ({ value, label }: { value: Tab; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`shrink-0 px-4 py-2 font-medium border-b-2 transition-colors ${
        tab === value
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="border-b flex gap-2 overflow-x-auto">
        <TabButton value="general" label="📋 General" />
        <TabButton value="gastos" label="💰 Gastos" />
        <TabButton
          value="imagenes"
          label={`🖼️ Imágenes${workOrder.images.length ? ` (${workOrder.images.length})` : ""}`}
        />
        <TabButton value="historial" label="🕒 Historial" />
      </div>

      {tab === "general" && (
        <div className="space-y-6">
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
        </div>
      )}

      {tab === "gastos" && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrderExpenses workOrderId={workOrder.id} expenses={workOrder.expenses} />
          </CardContent>
        </Card>
      )}

      {tab === "imagenes" && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrderImages workOrderId={workOrder.id} images={workOrder.images} canEdit />
          </CardContent>
        </Card>
      )}

      {tab === "historial" && (
        <div className="space-y-6">
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
      )}
    </div>
  );
}
