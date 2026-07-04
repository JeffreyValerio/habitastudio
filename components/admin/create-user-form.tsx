"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserDirectly } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["admin", "moderator", "collaborator", "taller-manager"]),
  hourlyRate: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function CreateUserForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "moderator",
    },
  });

  const selectedRole = watch("role");
  const password = watch("password");

  const onSubmit = async (data: CreateUserFormData) => {
    setLoading(true);
    try {
      const isCollaborator = selectedRole === "collaborator" || selectedRole === "taller-manager";
      await createUserDirectly({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        isCollaborator,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
      });
      toast({
        title: "Usuario creado",
        description: `${data.name} ya puede iniciar sesión con la contraseña que definiste. Compártesela por un medio seguro.`,
      });
      reset({ role: "moderator", name: "", email: "", password: "", hourlyRate: "" });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" placeholder="Juan Pérez" {...register("name")} className="mt-2" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@ejemplo.com"
          {...register("email")}
          className="mt-2"
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            {...register("password")}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue("password", generatePassword());
              setShowPassword(true);
            }}
          >
            Generar
          </Button>
        </div>
        {password && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-muted-foreground mt-1 hover:text-foreground"
          >
            {showPassword ? "Ocultar" : "Mostrar"} contraseña
          </button>
        )}
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
      </div>

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
      </div>

      {(selectedRole === "collaborator" || selectedRole === "taller-manager") && (
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
            Puedes editarla más adelante desde Gestión de Tiempo
          </p>
        </div>
      )}

      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-sm text-amber-900 dark:text-amber-100">
        <p className="font-medium mb-1">No se envía correo</p>
        <p>El usuario queda activo de inmediato. Comparte el email y la contraseña con él por un medio seguro.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creando...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </>
        )}
      </Button>
    </form>
  );
}
