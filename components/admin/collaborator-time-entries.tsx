"use client";

import { useState } from "react";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { deleteManualTimeEntry, updateManualTimeEntry } from "@/app/actions/timesheet";
import { WORK_ORDER_TYPES, WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { ArrowRight, Trash2, Pencil, Loader2 } from "lucide-react";

interface TimeEntry {
  id: string;
  entryDate: Date;
  entryTime: Date;
  exitTime: Date | null;
  description: string | null;
  workType: string | null;
  workOrder: { id: string; workOrderNumber: string } | null;
}

interface WorkOrderOption {
  id: string;
  workOrderNumber: string;
  quote: { clientName: string; projectName: string };
}

interface CollaboratorTimeEntriesProps {
  entries: TimeEntry[];
  entryRates: Record<string, number>;
  workOrders: WorkOrderOption[];
}

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().split("T")[0];
}

function toTimeInputValue(date: Date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CollaboratorTimeEntries({ entries, entryRates, workOrders }: CollaboratorTimeEntriesProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [entryDate, setEntryDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [workType, setWorkType] = useState("");
  const [description, setDescription] = useState("");

  const startEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEntryDate(toDateInputValue(entry.entryDate));
    setEntryTime(toTimeInputValue(entry.entryTime));
    setExitTime(entry.exitTime ? toTimeInputValue(entry.exitTime) : "");
    setWorkOrderId(entry.workOrder?.id || "");
    setWorkType(entry.workType || "");
    setDescription(entry.description || "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await updateManualTimeEntry(id, {
        entryDate,
        entryTime,
        exitTime: exitTime || undefined,
        workOrderId: workOrderId || undefined,
        workType: workType || undefined,
        description: description || undefined,
      });
      toast({ title: "Éxito", description: "Registro actualizado" });
      setEditingId(null);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteManualTimeEntry(id);
      toast({ title: "Éxito", description: "Registro eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar registro?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay registros de tiempo
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        let hours = 0;
        if (entry.exitTime) {
          const diffMs = new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime();
          hours = diffMs / (1000 * 60 * 60);
        }

        if (editingId === entry.id) {
          return (
            <div key={entry.id} className="p-4 rounded-lg border space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Fecha</label>
                  <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Entrada</label>
                  <Input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Salida</label>
                  <Input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Orden de Trabajo</label>
                  <select
                    value={workOrderId}
                    onChange={(e) => setWorkOrderId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="">Sin orden específica</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.workOrderNumber} — {wo.quote.clientName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo de Labor</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
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

              <div>
                <label className="text-xs text-muted-foreground">Descripción</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(entry.id)} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancelar
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="space-y-1">
              <p className="font-medium">
                {new Date(entry.entryDate).toLocaleDateString("es-CR")}
                {entry.workOrder && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {entry.workOrder.workOrderNumber}
                    {entry.workType && ` · ${WORK_ORDER_TYPE_LABELS[entry.workType] || entry.workType}`}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(entry.entryTime).toLocaleTimeString("es-CR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <span className="mx-2">
                  <ArrowRight className="inline h-4 w-4" />
                </span>
                {entry.exitTime
                  ? new Date(entry.exitTime).toLocaleTimeString("es-CR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Activo"}
              </p>
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-2">{entry.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {entry.exitTime && (
                <div className="text-right">
                  <p className="font-semibold">{hours.toFixed(1)}h</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCRC(hours * (entryRates[entry.id] || 0))}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => startEdit(entry)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
