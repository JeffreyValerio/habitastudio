import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturas</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de facturas emitidas a clientes
        </p>
      </div>

      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Próximamente</p>
          <p className="text-sm text-muted-foreground mt-1">
            Esta sección está en construcción
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
