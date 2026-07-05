import { notFound } from "next/navigation";
import { getCustomer } from "@/app/actions/crm";
import { getCurrentUser } from "@/lib/auth";
import { CustomerForm } from "@/components/admin/customer-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return <RestrictedAccess message="Solo los administradores pueden editar clientes." />;
  }

  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
      </div>
      <CustomerForm customer={customer} />
    </div>
  );
}
