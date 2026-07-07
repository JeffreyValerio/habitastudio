"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { adjustMaterialStock, deleteMaterial } from "@/app/actions/inventory";
import { MATERIAL_UNIT_LABELS } from "@/lib/inventory-types";
import { formatCRC } from "@/lib/utils";
import { Pencil, Trash2, Plus, Minus, Loader2, AlertTriangle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/admin/search-input";

const ITEMS_PER_PAGE = 15;

interface Material {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  quantity: number;
  minimumStock: number;
  supplier: { id: string; name: string } | null;
}

export function MaterialsTable({ materials }: { materials: Material[] }) {
  const { toast } = useToast();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [adjustQty, setAdjustQty] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const suppliers = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => {
      if (m.supplier) map.set(m.supplier.id, m.supplier.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesSupplier = supplierFilter === "all" || m.supplier?.id === supplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [materials, searchQuery, supplierFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, supplierFilter, materials]);

  const totalPages = Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startAdjust = (id: string, type: "in" | "out") => {
    setAdjustingId(id);
    setAdjustType(type);
    setAdjustQty("");
  };

  const saveAdjust = async (id: string) => {
    const qty = parseFloat(adjustQty);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Ingresa una cantidad válida", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await adjustMaterialStock(id, { type: adjustType, quantity: qty });
      toast({ title: "Éxito", description: "Stock actualizado" });
      setAdjustingId(null);
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
      await deleteMaterial(id);
      toast({ title: "Éxito", description: "Material eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar este material?",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          No hay materiales registrados todavía
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por nombre..." />
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
      {filteredMaterials.length === 0 ? (
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          No se encontraron materiales con esos filtros
        </CardContent>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Material</th>
              <th className="text-left py-3 px-4 font-semibold">Proveedor</th>
              <th className="text-right py-3 px-4 font-semibold">Costo/Unidad</th>
              <th className="text-right py-3 px-4 font-semibold">Stock</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMaterials.map((m) => {
              const low = m.quantity <= m.minimumStock;
              return (
                <tr key={m.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {m.name}
                      {low && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {m.supplier?.name || "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatCRC(m.costPerUnit)}</td>
                  <td className="py-3 px-4 text-right">
                    {adjustingId === m.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <select
                          value={adjustType}
                          onChange={(e) => setAdjustType(e.target.value as "in" | "out")}
                          className="text-xs border rounded px-1 py-1 bg-background"
                        >
                          <option value="in">Entrada</option>
                          <option value="out">Salida</option>
                        </select>
                        <Input
                          type="number"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          className="w-20 h-8 text-right"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveAdjust(m.id)} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "✓"}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAdjustingId(null)} disabled={saving}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant={low ? "destructive" : "secondary"}>
                          {m.quantity} {MATERIAL_UNIT_LABELS[m.unit] || m.unit}
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startAdjust(m.id, "in")} title="Agregar stock">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startAdjust(m.id, "out")} title="Descontar stock">
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/inventory/${m.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      </Card>
      {filteredMaterials.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
