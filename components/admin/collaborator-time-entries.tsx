"use client";

import { useState } from "react";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { deleteManualTimeEntry } from "@/app/actions/timesheet";
import { ArrowRight, Trash2 } from "lucide-react";

interface TimeEntry {
  id: string;
  entryDate: Date;
  entryTime: Date;
  exitTime: Date | null;
  description: string | null;
  project: { id: string; title: string } | null;
}

interface CollaboratorTimeEntriesProps {
  entries: TimeEntry[];
  hourlyRate: number | null;
}

export function CollaboratorTimeEntries({ entries, hourlyRate }: CollaboratorTimeEntriesProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

        return (
          <div
            key={entry.id}
            className="flex items-center justify-between p-4 rounded-lg border"
          >
            <div className="space-y-1">
              <p className="font-medium">
                {new Date(entry.entryDate).toLocaleDateString("es-CR")}
                {entry.project && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {entry.project.title}
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
                    {formatCRC(hours * (hourlyRate || 0))}
                  </p>
                </div>
              )}
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
