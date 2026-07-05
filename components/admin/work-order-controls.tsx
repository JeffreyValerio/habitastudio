"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setWorkOrderDeliveryDate, updateWorkOrderStatus } from "@/app/actions/work-orders";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/work-order-types";
import { Loader2 } from "lucide-react";

export function WorkOrderControls({
  workOrderId,
  status,
  deliveryDate,
}: {
  workOrderId: string;
  status: string;
  deliveryDate: Date | null;
}) {
  const { toast } = useToast();
  const [dateValue, setDateValue] = useState(
    deliveryDate ? new Date(deliveryDate).toISOString().split("T")[0] : ""
  );
  const [savingDate, setSavingDate] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const handleSaveDate = async () => {
    setSavingDate(true);
    try {
      await setWorkOrderDeliveryDate(workOrderId, dateValue || null);
      toast({
        title: "Éxito",
        description: dateValue ? "Orden liberada al taller" : "Fecha de entrega removida",
      });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingDate(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setSavingStatus(true);
    try {
      await updateWorkOrderStatus(workOrderId, newStatus as "pending" | "in_progress" | "completed");
      toast({ title: "Éxito", description: "Estado actualizado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Fecha de Compromiso de Entrega</Label>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground text-sm"
          />
          <Button onClick={handleSaveDate} disabled={savingDate} size="sm">
            {savingDate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {deliveryDate
            ? "Liberada: visible para el taller."
            : "Sin fecha: solo tú puedes ver esta orden."}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
        >
          {Object.entries(WORK_ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
