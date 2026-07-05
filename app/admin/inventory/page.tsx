import Link from "next/link";
import { getMaterials } from "@/app/actions/inventory";
import { MaterialsTable } from "@/components/admin/materials-table";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";

export default async function InventoryPage() {
  const materials = await getMaterials();
  const lowStockCount = materials.filter((m) => m.quantity <= m.minimumStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
          <p className="text-muted-foreground mt-2">
            {materials.length} materiales registrados
            {lowStockCount > 0 && (
              <span className="text-amber-600"> · {lowStockCount} con stock bajo</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/inventory/suppliers">
              <Truck className="mr-2 h-4 w-4" />
              Proveedores
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/admin/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Material
            </Link>
          </Button>
        </div>
      </div>

      <MaterialsTable materials={materials} />
    </div>
  );
}
