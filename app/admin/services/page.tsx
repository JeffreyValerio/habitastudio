import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getServices } from "@/app/actions/services";
import { ServicesGrid } from "@/components/admin/services-grid";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function ServicesPage() {
  const { allowed } = await getSectionAccess("admin.services");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Servicios</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver los servicios." />
      </div>
    );
  }

  const services = await getServices();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Servicios</h1>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Link>
        </Button>
      </div>
      <ServicesGrid services={services} />
    </div>
  );
}

