"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createSupplier, deleteSupplier } from "@/app/actions/inventory";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  _count: { materials: number };
}

export function SuppliersManager({ suppliers }: { suppliers: Supplier[] }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await createSupplier({ name, email: email || undefined, phone: phone || undefined, city: city || undefined });
      toast({ title: "Éxito", description: "Proveedor creado" });
      setName("");
      setEmail("");
      setPhone("");
      setCity("");
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSupplier(id);
      toast({ title: "Éxito", description: "Proveedor eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar este proveedor?",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Nuevo Proveedor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maderas del Valle" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Agregar Proveedor
          </Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-3">
        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
              No hay proveedores registrados
            </CardContent>
          </Card>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[s.email, s.phone, s.city].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {s._count.materials} {s._count.materials === 1 ? "material" : "materiales"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
