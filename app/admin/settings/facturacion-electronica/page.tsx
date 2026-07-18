import { getCurrentUser } from "@/lib/auth";
import { getEmisorConfig } from "@/app/actions/electronic-documents";
import { EmisorConfigForm } from "@/components/admin/emisor-config-form";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function FacturacionElectronicaSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facturación Electrónica</h1>
        </div>
        <RestrictedAccess message="Solo administradores pueden ver esta sección." />
      </div>
    );
  }

  const emisorConfig = await getEmisorConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturación Electrónica</h1>
        <p className="text-muted-foreground mt-2">
          Datos fiscales del emisor usados para generar comprobantes electrónicos ante Hacienda.
          Las credenciales de conexión (usuario, llave criptográfica) se configuran por variable de entorno, no aquí.
        </p>
      </div>

      <EmisorConfigForm emisorConfig={emisorConfig} />
    </div>
  );
}
