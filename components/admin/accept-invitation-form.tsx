"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { acceptInvitation } from "@/app/actions/invitations";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

const acceptSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type AcceptFormData = z.infer<typeof acceptSchema>;

export function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
              <h1 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                Enlace Inválido
              </h1>
              <p className="text-red-800 dark:text-red-200">
                Este enlace de invitación no es válido o ha expirado.
              </p>
              <Button asChild className="mt-4">
                <a href="/">Volver al inicio</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: AcceptFormData) => {
    setLoading(true);
    try {
      await acceptInvitation(token, data.password, data.name);
      setSuccess(true);
      toast({
        title: "Éxito",
        description: "Tu cuenta ha sido creada. Redirigiendo...",
      });
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al aceptar la invitación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h1 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                ¡Bienvenido!
              </h1>
              <p className="text-green-800 dark:text-green-200">
                Tu cuenta ha sido creada exitosamente. Redirigiendo al login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.svg"
              alt="Habita Studio"
              width={120}
              height={60}
              className="h-12 w-auto"
            />
          </div>
          <CardTitle className="text-center">Completar Tu Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                {...register("name")}
                className="mt-2"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="mt-2"
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="mt-2"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Completar Registro"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
