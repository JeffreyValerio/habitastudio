import Link from "next/link";
import { getMaterials } from "@/app/actions/inventory";
import { MaterialsTable } from "@/components/admin/materials-table";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";
import { Plus, Truck, Package, DollarSign, AlertTriangle } from "lucide-react";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function InventoryPage() {
  const { allowed } = await getSectionAccess("admin.inventory");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver el inventario." />
      </div>
    );
  }

  const materials = await getMaterials();
  const lowStockCount = materials.filter((m) => m.quantity <= m.minimumStock).length;
  const inventoryValue = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Materiales</h1>
          <p className="text-muted-foreground mt-2">Inventario de materia prima</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" asChild>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Materiales Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{materials.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Valor de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCRC(inventoryValue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Costo × cantidad en stock</p>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? "border-amber-200 dark:border-amber-800" : undefined}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Requieren reabastecimiento</p>
          </CardContent>
        </Card>
      </div>

      <MaterialsTable materials={materials} />
    </div>
  );
}
