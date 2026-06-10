import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getServices } from "@/app/actions/services";
import { ServicesGrid } from "@/components/admin/services-grid";

export default async function ServicesPage() {
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

