"use client";

import { useState, useEffect } from "react";
import { clockIn, clockOut, getMyCurrentEntry } from "@/app/actions/timesheet";
import { getMyActiveWorkOrdersForClock } from "@/app/actions/work-orders";
import { WORK_ORDER_TYPE_LABELS } from "@/lib/work-order-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogOut, LogIn } from "lucide-react";

interface TimeEntry {
  id: string;
  entryTime: string;
  exitTime: string | null;
  description: string | null;
  workType?: string | null;
  workOrder?: {
    id: string;
    workOrderNumber: string;
  } | null;
}

interface WorkOrderOption {
  id: string;
  workOrderNumber: string;
  quote: { clientName: string; projectName: string };
  assignments: { workType: string }[];
}

export function TimeClock() {
  const { toast } = useToast();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState<string>("0h 0m");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    loadCurrentEntry();
    loadWorkOrders();
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!currentEntry?.entryTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const entry = new Date(currentEntry.entryTime);
      const diffMs = now.getTime() - entry.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setElapsed(`${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentEntry?.entryTime]);

  const loadCurrentEntry = async () => {
    try {
      setLoadingInitial(true);
      const entry = await getMyCurrentEntry();
      setCurrentEntry(entry);
    } catch (error) {
      console.error("Error loading entry:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const data = await getMyActiveWorkOrdersForClock();
      setWorkOrders(data);
    } catch (error) {
      console.error("Error loading work orders:", error);
    }
  };

  const options = workOrders.flatMap((wo) =>
    wo.assignments.map((a) => ({
      value: `${wo.id}|${a.workType}`,
      label: `${wo.workOrderNumber} · ${WORK_ORDER_TYPE_LABELS[a.workType] || a.workType} — ${wo.quote.clientName}`,
    }))
  );

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const [workOrderId, workType] = selectedOption ? selectedOption.split("|") : [undefined, undefined];
      await clockIn(workOrderId, workType);
      await loadCurrentEntry();
      toast({
        title: "Éxito",
        description: "Has entrado al sistema",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar entrada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;

    setLoading(true);
    try {
      await clockOut(currentEntry.id);
      await loadCurrentEntry();
      toast({
        title: "Éxito",
        description: "Has salido del sistema",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar salida",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reloj de Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!currentEntry ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="work-order-select">Orden de Trabajo (opcional)</Label>
              <select
                id="work-order-select"
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm"
              >
                <option value="">Sin orden específica</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {options.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No tienes órdenes de trabajo activas asignadas todavía
                </p>
              )}
            </div>

            <Button
              onClick={handleClockIn}
              disabled={loading}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? "Registrando..." : "Entrada"}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Tiempo transcurrido</p>
              <p className="text-4xl font-bold text-green-600 font-mono">{elapsed}</p>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-muted">
              <div>
                <p className="text-xs text-muted-foreground">Entrada</p>
                <p className="font-medium">
                  {currentEntry.entryTime &&
                    new Date(currentEntry.entryTime).toLocaleTimeString("es-CR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                </p>
              </div>
              {currentEntry.workOrder && (
                <div>
                  <p className="text-xs text-muted-foreground">Orden de Trabajo</p>
                  <p className="font-medium">
                    {currentEntry.workOrder.workOrderNumber}
                    {currentEntry.workType && ` · ${WORK_ORDER_TYPE_LABELS[currentEntry.workType] || currentEntry.workType}`}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleClockOut}
              disabled={loading}
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <LogOut className="mr-2 h-5 w-5" />
              {loading ? "Registrando..." : "Salida"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
