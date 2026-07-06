"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { WorkOrderControls } from "@/components/admin/work-order-controls";
import { WorkOrderImages } from "@/components/admin/work-order-images";
import type { getWorkOrder } from "@/app/actions/work-orders";

type WorkOrderData = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

type Tab = "general" | "imagenes" | "historial";

export function TallerManagerWorkOrderDetailTabs({
  workOrder,
  totalHours,
}: {
  workOrder: WorkOrderData;
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
        <TabButton
          value="imagenes"
          label={`🖼️ Imágenes${workOrder.images.length ? ` (${workOrder.images.length})` : ""}`}
        />
        <TabButton value="historial" label="🕒 Historial" />
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Horas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </CardContent>
          </Card>

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
        </div>
      )}

      {tab === "imagenes" && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkOrderImages workOrderId={workOrder.id} images={workOrder.images} canEdit={false} />
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
