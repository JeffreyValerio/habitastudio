"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createManualTimeEntry } from "@/app/actions/timesheet";
import { WORK_ORDER_TYPES } from "@/lib/work-order-types";
import { Loader2 } from "lucide-react";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
}

interface WorkOrderOption {
  id: string;
  workOrderNumber: string;
  quote: { clientName: string; projectName: string };
}

interface ManualTimeEntryFormProps {
  collaborators: Collaborator[];
  workOrders: WorkOrderOption[];
  defaultUserId?: string;
  onSuccessRedirect?: string;
  requireWorkOrder?: boolean;
}

export function ManualTimeEntryForm({
  collaborators,
  workOrders,
  defaultUserId,
  onSuccessRedirect,
  requireWorkOrder = false,
}: ManualTimeEntryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [userId, setUserId] = useState(defaultUserId || "");
  const [workOrderId, setWorkOrderId] = useState("");
  const [workType, setWorkType] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast({ title: "Error", description: "Selecciona un colaborador", variant: "destructive" });
      return;
    }
    if (!entryTime) {
      toast({ title: "Error", description: "Ingresa la hora de entrada", variant: "destructive" });
      return;
    }
    if (requireWorkOrder && !workOrderId) {
      toast({ title: "Error", description: "Selecciona una orden de trabajo", variant: "destructive" });
      return;
    }
    if (requireWorkOrder && !workType) {
      toast({ title: "Error", description: "Selecciona un tipo de labor", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualTimeEntry({
        userId,
        workOrderId: workOrderId || undefined,
        workType: workType || undefined,
        entryDate,
        entryTime,
        exitTime: exitTime || undefined,
        description: description || undefined,
      });

      toast({ title: "Éxito", description: "Horas registradas correctamente" });
      router.push(onSuccessRedirect || `/admin/time-management/${userId}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar las horas",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="collaborator">Colaborador *</Label>
            <select
              id="collaborator"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              required
            >
              <option value="">Selecciona un colaborador</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Fecha *</Label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTime">Hora de Entrada *</Label>
              <Input
                id="entryTime"
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitTime">Hora de Salida</Label>
              <Input
                id="exitTime"
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workOrder">Orden de Trabajo {requireWorkOrder ? "*" : "(opcional)"}</Label>
              <select
                id="workOrder"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                required={requireWorkOrder}
              >
                <option value="">
                  {requireWorkOrder ? "Selecciona una orden de trabajo" : "Sin orden específica"}
                </option>
                {workOrders.map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.workOrderNumber} — {wo.quote.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workType">Tipo de Labor {requireWorkOrder ? "*" : "(opcional)"}</Label>
              <select
                id="workType"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                required={requireWorkOrder}
              >
                <option value="">Sin especificar</option>
                {WORK_ORDER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            {requireWorkOrder
              ? "Estas horas rebajan el presupuesto de la orden de trabajo. No cuentan para el salario del colaborador."
              : "Estas horas son de asistencia y cuentan para el salario del colaborador. No afectan el presupuesto de ninguna orden de trabajo."}
          </p>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del trabajo realizado..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Horas
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
