"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { markWorkOrderStage, revertWorkOrderStage } from "@/app/actions/work-orders";
import { WORK_ORDER_STAGES, WorkOrderStage } from "@/lib/work-order-types";
import { CheckCircle2, Circle, Loader2, Undo2 } from "lucide-react";

export function WorkOrderStages({
  workOrderId,
  corteCompletedAt,
  encintadoCompletedAt,
  armadoCompletedAt,
  instaladoCompletedAt,
  canEdit,
  canRevert = false,
}: {
  workOrderId: string;
  corteCompletedAt: Date | null;
  encintadoCompletedAt: Date | null;
  armadoCompletedAt: Date | null;
  instaladoCompletedAt: Date | null;
  canEdit: boolean;
  canRevert?: boolean;
}) {
  const { toast } = useToast();
  const [marking, setMarking] = useState<WorkOrderStage | null>(null);
  const [reverting, setReverting] = useState<WorkOrderStage | null>(null);

  const completedAtByStage: Record<WorkOrderStage, Date | null> = {
    corte: corteCompletedAt,
    encintado: encintadoCompletedAt,
    armado: armadoCompletedAt,
    instalado: instaladoCompletedAt,
  };

  const nextIndex = WORK_ORDER_STAGES.findIndex((s) => !completedAtByStage[s.key]);
  const lastCompletedIndex = nextIndex === -1 ? WORK_ORDER_STAGES.length - 1 : nextIndex - 1;

  const handleMark = async (stage: WorkOrderStage) => {
    setMarking(stage);
    try {
      const result = await markWorkOrderStage(workOrderId, stage);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: `Etapa "${stage}" marcada como completada` });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setMarking(null);
    }
  };

  const handleRevert = async (stage: WorkOrderStage) => {
    setReverting(stage);
    try {
      const result = await revertWorkOrderStage(workOrderId, stage);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: `Se revirtió la etapa "${stage}"` });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setReverting(null);
    }
  };

  return (
    <div className="space-y-2">
      {WORK_ORDER_STAGES.map((s, i) => {
        const completedAt = completedAtByStage[s.key];
        const isDone = !!completedAt;
        const isNext = i === nextIndex;

        return (
          <div
            key={s.key}
            className={`flex items-center justify-between p-3 rounded-lg border ${isDone ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" : ""}`}
          >
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className={isDone ? "font-medium" : isNext ? "font-medium" : "text-muted-foreground"}>
                  {s.label}
                </p>
                {isDone && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(completedAt).toLocaleString("es-CR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>
            </div>
            {canEdit && isNext && (
              <Button size="sm" onClick={() => handleMark(s.key)} disabled={marking === s.key}>
                {marking === s.key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Marcar Completado
              </Button>
            )}
            {canRevert && i === lastCompletedIndex && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRevert(s.key)}
                disabled={reverting === s.key}
              >
                {reverting === s.key ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="mr-2 h-4 w-4" />
                )}
                Revertir
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
