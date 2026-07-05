import { getCurrentUser } from "@/lib/auth";
import { CrmCustomersPageClient } from "@/components/admin/crm-customers-page-client";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function CustomersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
        </div>
        <RestrictedAccess message="Solo los administradores pueden ver clientes." />
      </div>
    );
  }

  return <CrmCustomersPageClient />;
}
