import Link from "next/link";
import { getSuppliers } from "@/app/actions/inventory";
import { SuppliersManager } from "@/components/admin/suppliers-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/admin/inventory">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Materiales
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <p className="text-muted-foreground mt-2">Proveedores de materia prima</p>
      </div>

      <SuppliersManager suppliers={suppliers} />
    </div>
  );
}
