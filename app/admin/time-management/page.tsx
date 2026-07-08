import { TimeManagementDashboard } from "@/components/admin/time-management-dashboard";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function TimeManagementPage() {
  const { user, allowed } = await getSectionAccess("admin.time-management");

  if (!user || !allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tiempo</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver la gestión de tiempo." />
      </div>
    );
  }

  return <TimeManagementDashboard role={user.role} />;
}
