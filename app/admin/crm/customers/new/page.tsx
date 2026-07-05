import { getCurrentUser } from "@/lib/auth";
import { CustomerForm } from "@/components/admin/customer-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function NewCustomerPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        </div>
        <RestrictedAccess message="Solo los administradores pueden crear clientes." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
      </div>
      <CustomerForm />
    </div>
  );
}
