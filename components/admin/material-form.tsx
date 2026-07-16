"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createMaterial, updateMaterial } from "@/app/actions/inventory";
import { MATERIAL_UNITS } from "@/lib/inventory-types";
import { Loader2 } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface MaterialFormProps {
  material?: {
    id: string;
    name: string;
    unit: string;
    costPerUnit: number;
    quantity: number;
    minimumStock: number;
    supplierId: string | null;
    notes: string | null;
  };
  suppliers: Supplier[];
}

export function MaterialForm({ material, suppliers }: MaterialFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(material?.name || "");
  const [unit, setUnit] = useState(material?.unit || "unidad");
  const [costPerUnit, setCostPerUnit] = useState(material ? String(material.costPerUnit) : "");
  const [quantity, setQuantity] = useState(material ? String(material.quantity) : "0");
  const [minimumStock, setMinimumStock] = useState(material ? String(material.minimumStock) : "0");
  const [supplierId, setSupplierId] = useState(material?.supplierId || "");
  const [notes, setNotes] = useState(material?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !unit || !costPerUnit) {
      toast({ title: "Error", description: "Completa nombre, unidad y costo", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (material) {
        const result = await updateMaterial(material.id, {
          name,
          unit,
          costPerUnit: parseFloat(costPerUnit),
          minimumStock: parseFloat(minimumStock) || 0,
          supplierId: supplierId || undefined,
          notes: notes || undefined,
        });
        if (!result.ok) {
          toast({ title: "Error", description: result.message, variant: "destructive" });
          return;
        }
        toast({ title: "Éxito", description: "Material actualizado" });
      } else {
        const result = await createMaterial({
          name,
          unit,
          costPerUnit: parseFloat(costPerUnit),
          quantity: parseFloat(quantity) || 0,
          minimumStock: parseFloat(minimumStock) || 0,
          supplierId: supplierId || undefined,
          notes: notes || undefined,
        });
        if (!result.ok) {
          toast({ title: "Error", description: result.message, variant: "destructive" });
          return;
        }
        toast({ title: "Éxito", description: "Material creado" });
      }
      router.push("/admin/inventory");
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al guardar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lámina MDF 18mm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida *</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              >
                {MATERIAL_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Costo por Unidad (₡) *</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="15000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!material && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad Inicial</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="minimumStock">Stock Mínimo (alerta)</Label>
              <Input
                id="minimumStock"
                type="number"
                step="0.01"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor (opcional)</Label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {material ? "Actualizar" : "Crear Material"}
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
