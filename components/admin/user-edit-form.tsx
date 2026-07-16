"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateUser } from "@/app/actions/users";
import { Loader2 } from "lucide-react";

interface UserEditFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    hourlyRate: number | null;
  };
}

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate ? String(user.hourlyRate) : "");
  const [password, setPassword] = useState("");

  const showRate = role === "collaborator" || role === "taller-manager";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast({ title: "Error", description: "Nombre y correo son requeridos", variant: "destructive" });
      return;
    }
    if (password && password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateUser(user.id, {
        name,
        email,
        role: role as "admin" | "moderator" | "collaborator" | "taller-manager",
        hourlyRate: showRate && hourlyRate ? parseFloat(hourlyRate) : undefined,
        password: password || undefined,
      });
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({ title: "Éxito", description: "Usuario actualizado" });
      router.push("/admin/settings/users");
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al actualizar", variant: "destructive" });
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="admin">Administrador</option>
              <option value="moderator">Moderador</option>
              <option value="collaborator">Colaborador</option>
              <option value="taller-manager">Jefe de Taller</option>
            </select>
          </div>

          {showRate && (
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Tarifa por Hora (₡)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacío para mantener la actual"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
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
