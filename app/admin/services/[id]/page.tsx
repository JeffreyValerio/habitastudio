import { getService } from "@/app/actions/services";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getService(id);

  if (!service) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Servicio</h1>
      <ServiceForm service={service} />
    </div>
  );
}

