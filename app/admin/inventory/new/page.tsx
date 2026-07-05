import { getSuppliers } from "@/app/actions/inventory";
import { MaterialForm } from "@/components/admin/material-form";

export default async function NewMaterialPage() {
  const suppliers = await getSuppliers();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Nuevo Material</h1>
      <MaterialForm suppliers={suppliers} />
    </div>
  );
}
