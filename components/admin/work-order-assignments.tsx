"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { assignCollaboratorToWorkOrder, removeWorkOrderAssignment } from "@/app/actions/work-orders";
import { WORK_ORDER_TYPES, WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Collaborator {
  id: string;
  name: string | null;
  email: string;
}

interface Assignment {
  id: string;
  workType: string;
  user: { id: string; name: string | null; email: string };
}

export function WorkOrderAssignments({
  workOrderId,
  assignments,
  collaborators,
}: {
  workOrderId: string;
  assignments: Assignment[];
  collaborators: Collaborator[];
}) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [workType, setWorkType] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!userId || !workType) {
      toast({ title: "Error", description: "Selecciona colaborador y tipo de labor", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      await assignCollaboratorToWorkOrder(workOrderId, userId, workType);
      toast({ title: "Éxito", description: "Colaborador asignado" });
      setUserId("");
      setWorkType("");
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al asignar", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeWorkOrderAssignment(id);
      toast({ title: "Éxito", description: "Asignación eliminada" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemove = (id: string) => {
    toast({
      title: "¿Quitar esta asignación?",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar" onClick={() => confirmRemove(id)}>
          Quitar
        </ToastAction>
      ),
    });
  };

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin colaboradores asignados todavía</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{a.user.name || a.user.email}</p>
                <p className="text-xs text-muted-foreground">{WORK_ORDER_TYPE_LABELS[a.workType] || a.workType}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleRemove(a.id)}
                disabled={removingId === a.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-2 pt-2 border-t">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground text-sm"
        >
          <option value="">Colaborador...</option>
          {collaborators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.email}
            </option>
          ))}
        </select>
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground text-sm"
        >
          <option value="">Tipo de labor...</option>
          {WORK_ORDER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Button onClick={handleAdd} disabled={adding} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
