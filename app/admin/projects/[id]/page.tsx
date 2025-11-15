import { getProject } from "@/app/actions/projects";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Proyecto</h1>
      <ProjectForm project={project} />
    </div>
  );
}

