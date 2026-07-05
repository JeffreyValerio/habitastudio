import Link from "next/link";
import { getCollaboratorDetails, getCollaboratorTimeEntries } from "@/app/actions/timesheet";
import { getWorkOrdersForSelect } from "@/app/actions/work-orders";
import { getEffectiveRatesBatch, getCollaboratorRateHistory } from "@/app/actions/collaborator-rates";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { formatCRC } from "@/lib/utils";
import { Clock, DollarSign, Calendar, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { CollaboratorTimeEntries } from "@/components/admin/collaborator-time-entries";
import { CollaboratorRateHistory } from "@/components/admin/collaborator-rate-history";

export default async function CollaboratorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    return <RestrictedAccess message="Solo los administradores pueden ver la gestión de tiempo." />;
  }

  const collaborator = await getCollaboratorDetails(id);

  if (!collaborator) {
    notFound();
  }

  const [timeEntries, workOrders, rateHistory] = await Promise.all([
    getCollaboratorTimeEntries(id),
    getWorkOrdersForSelect(),
    getCollaboratorRateHistory(id),
  ]);

  // Resolver la tarifa vigente para cada mes en que hay entradas (puede variar mes a mes)
  const uniquePeriods = Array.from(
    new Set(timeEntries.map((e) => {
      const d = new Date(e.entryDate);
      return `${d.getFullYear()}-${d.getMonth() + 1}`;
    }))
  ).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return { userId: id, year, month };
  });
  const ratesByPeriod = await getEffectiveRatesBatch(uniquePeriods);

  const getRateForEntry = (entryDate: Date) => {
    const d = new Date(entryDate);
    const key = `${id}-${d.getFullYear()}-${d.getMonth() + 1}`;
    return ratesByPeriod[key] ?? collaborator.hourlyRate ?? 0;
  };

  // Calcular horas totales y salario estimado usando la tarifa vigente de cada mes
  let totalHours = 0;
  let estimatedSalary = 0;
  timeEntries.forEach((entry) => {
    if (entry.exitTime) {
      const diffMs = new Date(entry.exitTime).getTime() - new Date(entry.entryTime).getTime();
      const hours = diffMs / (1000 * 60 * 60);
      totalHours += hours;
      estimatedSalary += hours * getRateForEntry(entry.entryDate);
    }
  });

  const entryRates: Record<string, number> = {};
  timeEntries.forEach((entry) => {
    entryRates[entry.id] = getRateForEntry(entry.entryDate);
  });

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
              Tarifa Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₡{(collaborator.hourlyRate || 0).toFixed(0)}<span className="text-sm text-muted-foreground">/h</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Puede variar por mes, ver historial abajo</p>
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

      {/* Rate History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Tarifas</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorRateHistory
            userId={collaborator.id}
            history={rateHistory}
            baseRate={collaborator.hourlyRate}
          />
        </CardContent>
      </Card>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorTimeEntries entries={timeEntries} entryRates={entryRates} workOrders={workOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
