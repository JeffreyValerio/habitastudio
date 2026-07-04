import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Mail, User, Calendar } from "lucide-react";

export default async function CollaboratorProfile() {
  const user = await getCurrentUser();

  if (!user || user.role !== "collaborator") {
    redirect("/admin/login");
  }

  // Get full user data with hourly rate
  const collaborator = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      hourlyRate: true,
      createdAt: true,
    },
  });

  if (!collaborator) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Información de tu cuenta y salario
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Nombre
            </p>
            <p className="text-lg font-medium">{collaborator.name || "No especificado"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </p>
            <p className="text-lg font-medium">{collaborator.email}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Miembro desde
            </p>
            <p className="text-lg font-medium">
              {new Date(collaborator.createdAt).toLocaleDateString("es-CR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salary Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Información Salarial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">
              Tarifa Horaria
            </p>
            <p className="text-2xl font-bold">
              {collaborator.hourlyRate ? (
                <>
                  ₡{collaborator.hourlyRate.toFixed(0)}<span className="text-sm text-muted-foreground">/h</span>
                </>
              ) : (
                <span className="text-muted-foreground">No asignada</span>
              )}
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Tu salario se calcula automáticamente según las horas registradas durante el mes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Salary History - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Salarios</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <p>Próximamente - historial de nóminas mensuales</p>
        </CardContent>
      </Card>
    </div>
  );
}
