"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { setCollaboratorRate, deleteCollaboratorRate } from "@/app/actions/collaborator-rates";
import { formatCRC } from "@/lib/utils";
import { Plus, Trash2, Loader2 } from "lucide-react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface RateEntry {
  id: string;
  year: number;
  month: number;
  hourlyRate: number;
}

export function CollaboratorRateHistory({
  userId,
  history,
  baseRate,
  canEdit = true,
}: {
  userId: string;
  history: RateEntry[];
  baseRate: number | null;
  canEdit?: boolean;
}) {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i + 1);

  const handleAdd = async () => {
    const rateNum = parseFloat(rate);
    if (!rateNum || rateNum < 0) {
      toast({ title: "Error", description: "Ingresa una tarifa válida", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const result = await setCollaboratorRate(userId, year, month, rateNum);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Éxito",
        description: `Tarifa fijada desde ${MONTH_NAMES[month - 1]} ${year} en adelante`,
      });
      setRate("");
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
      const result = await deleteCollaboratorRate(id);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Tarifa eliminada del historial" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar esta tarifa del historial?",
      description: "Los meses que dependían de este valor pasarán a usar la tarifa anterior más reciente.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cada tarifa que fijas aquí rige desde ese mes en adelante, hasta que fijes una más reciente.
        Base actual: <span className="font-medium">{baseRate ? formatCRC(baseRate) + "/h" : "sin definir"}</span>
      </p>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cambios de tarifa registrados todavía</p>
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">
                {MONTH_NAMES[h.month - 1]} {h.year} en adelante
              </span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCRC(h.hourlyRate)}/h</span>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(h.id)}
                    disabled={deletingId === h.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 border-t">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Nueva tarifa ₡"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Fijar Tarifa
          </Button>
        </div>
      )}
    </div>
  );
}
