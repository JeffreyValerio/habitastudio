import { getCurrentUser } from "@/lib/auth";
import { TimeManagementDashboard } from "@/components/admin/time-management-dashboard";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function TimeManagementPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tiempo</h1>
        </div>
        <RestrictedAccess message="Solo los administradores pueden ver la gestión de tiempo." />
      </div>
    );
  }

  return <TimeManagementDashboard />;
}
