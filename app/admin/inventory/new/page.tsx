import { getSuppliers } from "@/app/actions/inventory";
import { MaterialForm } from "@/components/admin/material-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function NewMaterialPage() {
  const { allowed } = await getSectionAccess("admin.inventory");

  if (!allowed) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Nuevo Material</h1>
        <RestrictedAccess message="No tienes permiso para gestionar el inventario." />
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
