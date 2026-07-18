import { getWorkOrdersForInvoicing, getEmisorConfig } from "@/app/actions/electronic-documents";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function InvoicesPage() {
  const { allowed } = await getSectionAccess("admin.invoices");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver las facturas." />
      </div>
    );
  }

  const [workOrders, emisorConfig] = await Promise.all([getWorkOrdersForInvoicing(), getEmisorConfig()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturas</h1>
        <p className="text-muted-foreground mt-2">
          Órdenes de trabajo entregadas, listas para facturar. Genera la factura, revísala y decide cuándo enviarla a
          Hacienda.
        </p>
      </div>

      <InvoicesTable workOrders={workOrders} emisorConfig={emisorConfig} />
    </div>
  );
}
