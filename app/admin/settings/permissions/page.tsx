import { getCurrentUser } from "@/lib/auth";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getAllRolePermissions } from "@/app/actions/role-permissions";
import { RolePermissionsForm } from "@/components/admin/role-permissions-form";

export default async function PermissionsSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permisos por Rol</h1>
        </div>
        <RestrictedAccess message="Solo los administradores pueden configurar permisos." />
      </div>
    );
  }

  const permissions = await getAllRolePermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permisos por Rol</h1>
        <p className="text-muted-foreground mt-2">
          Elige qué secciones puede ver cada rol en su panel
        </p>
      </div>

      <RolePermissionsForm initialPermissions={permissions} />
    </div>
  );
}
