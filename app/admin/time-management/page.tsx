import { getCollaborators } from "@/app/actions/timesheet";
import { CollaboratorsTable } from "@/components/admin/collaborators-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function TimeManagementPage() {
  const collaborators = await getCollaborators();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Tiempo</h1>
        <p className="text-muted-foreground mt-2">
          Administra las horas y nómina de tus colaboradores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{collaborators.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activos Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Próximamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horas Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Próximamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Colaboradores */}
      <div>
        <h2 className="text-xl font-bold mb-4">Colaboradores</h2>
        <CollaboratorsTable collaborators={collaborators} />
      </div>
    </div>
  );
}
