import { CrmCustomersPageClient } from "@/components/admin/crm-customers-page-client";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function CustomersPage() {
  const { allowed } = await getSectionAccess("admin.crm.customers");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver clientes." />
      </div>
    );
  }

  return <CrmCustomersPageClient />;
}
