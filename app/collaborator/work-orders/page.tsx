import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default async function WorkOrdersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "collaborator") {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <p className="text-muted-foreground mt-2">
          Tus proyectos y tareas asignadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Órdenes Activas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
          <p>No hay órdenes de trabajo asignadas</p>
          <p className="text-sm mt-2">
            Las órdenes de trabajo aparecerán aquí cuando el equipo te asigne proyectos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
