import Link from "next/link";
import { getCollaboratorDetails, getCollaboratorTimeEntries } from "@/app/actions/timesheet";
import { getWorkOrdersForSelect } from "@/app/actions/work-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCRC } from "@/lib/utils";
import { Clock, DollarSign, Calendar, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { CollaboratorTimeEntries } from "@/components/admin/collaborator-time-entries";

export default async function CollaboratorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collaborator = await getCollaboratorDetails(id);

  if (!collaborator) {
    notFound();
  }

  const [timeEntries, workOrders] = await Promise.all([
    getCollaboratorTimeEntries(id),
    getWorkOrdersForSelect(),
  ]);

  // Calculate total hours
  const totalHours = timeEntries.reduce((sum, entry) => {
    if (entry.exitTime) {
      const entryDate = new Date(entry.entryTime);
      const exitDate = new Date(entry.exitTime);
      const diffMs = exitDate.getTime() - entryDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }
    return sum;
  }, 0);

  const estimatedSalary = totalHours * (collaborator.hourlyRate || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{collaborator.name || "Sin nombre"}</h1>
          <p className="text-muted-foreground mt-2">{collaborator.email}</p>
        </div>
        <Button asChild size="lg">
          <Link href={`/admin/time-management/new?userId=${collaborator.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Horas
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tarifa Horaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₡{(collaborator.hourlyRate || 0).toFixed(0)}<span className="text-sm text-muted-foreground">/h</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salario Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCRC(estimatedSalary)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorTimeEntries entries={timeEntries} hourlyRate={collaborator.hourlyRate} workOrders={workOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
