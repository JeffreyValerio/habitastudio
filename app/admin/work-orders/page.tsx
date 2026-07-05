import { getWorkOrders } from "@/app/actions/work-orders";
import { WorkOrdersGrid } from "@/components/admin/work-orders-grid";

export default async function WorkOrdersPage() {
  const workOrders = await getWorkOrders();

  const pending = workOrders.filter((w) => w.status === "pending").length;
  const inProgress = workOrders.filter((w) => w.status === "in_progress").length;
  const completed = workOrders.filter((w) => w.status === "completed").length;
  const unreleased = workOrders.filter((w) => !w.deliveryDate).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
        <p className="text-muted-foreground mt-2">
          Se crean automáticamente al aceptar una cotización. Asigna colaboradores y libera
          la fecha de entrega para que el taller pueda verla y trabajarla.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{workOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{unreleased}</p>
          <p className="text-xs text-muted-foreground mt-1">Sin liberar</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
          <p className="text-xs text-muted-foreground mt-1">En Progreso</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Completadas</p>
        </div>
      </div>

      <WorkOrdersGrid workOrders={workOrders} />
    </div>
  );
}
