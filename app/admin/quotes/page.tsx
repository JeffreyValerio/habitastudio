import { QuotesPageClient } from "@/components/admin/quotes-page-client";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function QuotesPage() {
  const { allowed } = await getSectionAccess("admin.quotes");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver las cotizaciones." />
      </div>
    );
  }

  return <QuotesPageClient />;
}
