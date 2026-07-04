import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimeClock } from "@/components/admin/time-clock";
import { HoursToday } from "@/components/admin/hours-today";
import { HoursThisMonth } from "@/components/admin/hours-this-month";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Redirigir a login si no está autenticado
  if (!user) {
    redirect("/admin/login");
  }

  // Solo colaboradores y admin pueden acceder
  if (user.role !== "admin" && user.role !== "collaborator") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Horas</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido, {user.name || user.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reloj de Entrada/Salida */}
          <div className="lg:col-span-1">
            <TimeClock userId={user.id} />
          </div>

          {/* Horas del Día */}
          <div className="lg:col-span-1">
            <HoursToday userId={user.id} />
          </div>

          {/* Horas del Mes */}
          <div className="lg:col-span-1">
            <HoursThisMonth userId={user.id} />
          </div>
        </div>

        {/* Información */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cómo usar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Entrada:</strong> Haz clic en "Registrar Entrada" cuando llegues al taller
            </p>
            <p>
              <strong>2. Salida:</strong> Haz clic en "Registrar Salida" cuando termines
            </p>
            <p>
              <strong>3. Proyectos:</strong> Selecciona el proyecto en el que trabajaste (opcional)
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Las horas se calculan automáticamente para tu nómina
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
