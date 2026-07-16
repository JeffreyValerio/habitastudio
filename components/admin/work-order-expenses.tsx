"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { addWorkOrderExpense, deleteWorkOrderExpense } from "@/app/actions/work-orders";
import { getMaterialsForSelect } from "@/app/actions/inventory";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/work-order-types";
import { formatCRC } from "@/lib/utils";
import { Plus, Trash2, Loader2, Boxes, Pencil as PencilIcon } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: Date;
  materialId: string | null;
  creator: { id: string; name: string | null };
}

interface MaterialOption {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  quantity: number;
}

export function WorkOrderExpenses({
  workOrderId,
  expenses,
}: {
  workOrderId: string;
  expenses: Expense[];
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"inventory" | "manual">("inventory");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);

  // Modo inventario
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");

  // Modo manual
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    getMaterialsForSelect().then(setMaterials).catch(() => {});
  }, []);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const selectedMaterial = materials.find((m) => m.id === materialId);
  const estimatedCost = selectedMaterial ? selectedMaterial.costPerUnit * (parseFloat(quantity) || 0) : 0;

  const handleAddFromInventory = async () => {
    const qty = parseFloat(quantity);
    if (!materialId || !qty || qty <= 0) {
      toast({ title: "Error", description: "Selecciona un material y una cantidad válida", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const result = await addWorkOrderExpense(workOrderId, { materialId, quantity: qty });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Gasto registrado y stock descontado" });
      setMaterialId("");
      setQuantity("");
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al registrar el gasto", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleAddManual = async () => {
    const amountNum = parseFloat(amount);
    if (!category || !description || !amountNum || amountNum <= 0) {
      toast({ title: "Error", description: "Completa categoría, descripción y un monto válido", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const result = await addWorkOrderExpense(workOrderId, { category, description, amount: amountNum });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Gasto registrado" });
      setCategory("");
      setDescription("");
      setAmount("");
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al registrar el gasto", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const result = await deleteWorkOrderExpense(id);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Gasto eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemove = (id: string, materialId: string | null) => {
    toast({
      title: "¿Eliminar este gasto?",
      description: materialId ? "El stock consumido se devolverá al inventario." : undefined,
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar" onClick={() => confirmRemove(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin gastos registrados todavía</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {e.materialId && <Boxes className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{e.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {EXPENSE_CATEGORY_LABELS[e.category] || e.category} · {new Date(e.expenseDate).toLocaleDateString("es-CR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCRC(e.amount)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemove(e.id, e.materialId)}
                  disabled={removingId === e.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t font-semibold text-sm">
            <span>Total gastos</span>
            <span>{formatCRC(total)}</span>
          </div>
        </div>
      )}

      <div className="pt-2 border-t space-y-3">
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => setMode("inventory")}
            className={`pb-1 border-b-2 transition-colors ${mode === "inventory" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}
          >
            Desde Inventario
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`pb-1 border-b-2 transition-colors ${mode === "manual" ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"}`}
          >
            Gasto Manual
          </button>
        </div>

        {mode === "inventory" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="md:col-span-2 px-3 py-2 border rounded-md bg-background text-foreground text-sm"
            >
              <option value="">Material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.quantity} {m.unit} disponibles)
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder={selectedMaterial ? `Cantidad (${selectedMaterial.unit})` : "Cantidad"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Button onClick={handleAddFromInventory} disabled={adding} size="sm">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            {selectedMaterial && quantity && (
              <p className="md:col-span-4 text-xs text-muted-foreground">
                Costo estimado: {formatCRC(estimatedCost)}
              </p>
            )}
            {materials.length === 0 && (
              <p className="md:col-span-4 text-xs text-muted-foreground">
                No hay materiales en inventario todavía.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
            >
              <option value="">Categoría...</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Input
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="md:col-span-2"
            />
            <Input
              type="number"
              placeholder="Monto ₡"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button onClick={handleAddManual} disabled={adding} size="sm" className="md:col-span-4">
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Agregar Gasto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
