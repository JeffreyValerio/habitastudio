import { getCollaborators } from "@/app/actions/timesheet";
import { getWorkOrdersForSelect } from "@/app/actions/work-orders";
import { getCurrentUser } from "@/lib/auth";
import { ManualTimeEntryForm } from "@/components/admin/manual-time-entry-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Registrar Horas</h1>
        </div>
        <RestrictedAccess message="Solo los administradores pueden registrar horas." />
      </div>
    );
  }

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
