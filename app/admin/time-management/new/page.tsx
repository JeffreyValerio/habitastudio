import { getCollaborators } from "@/app/actions/timesheet";
import { getWorkOrdersForSelect } from "@/app/actions/work-orders";
import { ManualTimeEntryForm } from "@/components/admin/manual-time-entry-form";

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  const [collaborators, workOrders] = await Promise.all([
    getCollaborators(),
    getWorkOrdersForSelect(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Registrar Horas</h1>
        <p className="text-muted-foreground mt-2">
          Elige un colaborador y registra sus horas de entrada y salida
        </p>
      </div>

      <ManualTimeEntryForm
        collaborators={collaborators}
        workOrders={workOrders}
        defaultUserId={userId}
      />
    </div>
  );
}
