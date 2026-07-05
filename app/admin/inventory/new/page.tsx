import { getSuppliers } from "@/app/actions/inventory";
import { getCurrentUser } from "@/lib/auth";
import { MaterialForm } from "@/components/admin/material-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function NewMaterialPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Nuevo Material</h1>
        <RestrictedAccess message="Solo los administradores pueden gestionar el inventario." />
      </div>
    );
  }

  const suppliers = await getSuppliers();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Nuevo Material</h1>
      <MaterialForm suppliers={suppliers} />
    </div>
  );
}
