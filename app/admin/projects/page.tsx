import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getProjects } from "@/app/actions/projects";
import { ProjectsTable } from "@/components/admin/projects-table";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function ProjectsPage() {
  const { allowed } = await getSectionAccess("admin.projects");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Proyectos</h1>
        </div>
        <RestrictedAccess message="No tienes permiso para ver los proyectos." />
      </div>
    );
  }

  const projects = await getProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Link>
        </Button>
      </div>
      <ProjectsTable projects={projects} />
    </div>
  );
}

