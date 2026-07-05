import { notFound } from "next/navigation";
import { getMaterial } from "@/app/actions/inventory";
import { getSuppliers } from "@/app/actions/inventory";
import { getCurrentUser } from "@/lib/auth";
import { MaterialForm } from "@/components/admin/material-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MATERIAL_UNIT_LABELS } from "@/lib/inventory-types";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return <RestrictedAccess message="Solo los administradores pueden gestionar el inventario." />;
  }

  const [material, suppliers] = await Promise.all([
    getMaterial(id),
    getSuppliers(),
  ]);

  if (!material) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{material.name}</h1>
        <p className="text-muted-foreground mt-1">
          Stock actual: {material.quantity} {MATERIAL_UNIT_LABELS[material.unit] || material.unit}
        </p>
      </div>

      <MaterialForm material={material} suppliers={suppliers} />

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {material.movements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {material.movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <p className="font-medium">
                      {m.type === "in" ? "Entrada" : "Salida"} · {m.reference || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("es-CR")} · {m.creator.name}
                    </p>
                  </div>
                  <span className={`font-semibold ${m.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {m.type === "in" ? "+" : "-"}{m.quantity} {MATERIAL_UNIT_LABELS[material.unit] || material.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
