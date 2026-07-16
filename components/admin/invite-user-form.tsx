"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { inviteUser } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "moderator", "collaborator", "taller-manager"]),
  isCollaborator: z.boolean().default(false),
  hourlyRate: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteUserForm({ hideCard = false }: { hideCard?: boolean } = {}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "moderator",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: InviteFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        isCollaborator: selectedRole === "collaborator" || selectedRole === "taller-manager",
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
      };
      const result = await inviteUser(payload);
      if (!result.ok) {
        toast({ title: "Error", description: result.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Éxito",
        description: `Invitación enviada a ${data.email}`,
      });
      // Reset form
      setValue("email", "");
      setValue("role", "moderator");
      setValue("hourlyRate", "");
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al enviar la invitación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              {...register("email")}
              className="mt-2"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select value={selectedRole} onValueChange={(value) => setValue("role", value as any)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div>
                    <p className="font-medium">Administrador</p>
                    <p className="text-xs text-muted-foreground">Acceso completo</p>
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div>
                    <p className="font-medium">Moderador</p>
                    <p className="text-xs text-muted-foreground">Acceso limitado</p>
                  </div>
                </SelectItem>
                <SelectItem value="collaborator">
                  <div>
                    <p className="font-medium">Colaborador</p>
                    <p className="text-xs text-muted-foreground">Registro de horas</p>
                  </div>
                </SelectItem>
                <SelectItem value="taller-manager">
                  <div>
                    <p className="font-medium">Jefe de Taller</p>
                    <p className="text-xs text-muted-foreground">Aprobación de horas</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Tarifa por Hora - mostrar para colaborador y jefe de taller */}
          {(selectedRole === "collaborator" || selectedRole === "taller-manager") && (
            <>
              <div>
                <Label htmlFor="hourlyRate">Tarifa por Hora (₡)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="5000"
                  step="100"
                  {...register("hourlyRate")}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tarifa para cálculo automático de nómina
                </p>
              </div>
            </>
          )}

          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">¿Qué recibirá?</p>
            <p>
              Se enviará un correo con un enlace de invitación válido por 7
              días.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Invitación
              </>
            )}
          </Button>
    </form>
  );

  if (hideCard) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitar Usuario
        </CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
