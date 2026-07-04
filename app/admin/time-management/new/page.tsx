import { getCollaborators } from "@/app/actions/timesheet";
import { getProjects } from "@/app/actions/projects";
import { ManualTimeEntryForm } from "@/components/admin/manual-time-entry-form";

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  const [collaborators, projects] = await Promise.all([
    getCollaborators(),
    getProjects(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Registrar Horas</h1>
        <p className="text-muted-foreground mt-2">
          Elige un colaborador y registra sus horas de entrada y salida
        </p>
      </div>

      <ManualTimeEntryForm
        collaborators={collaborators}
        projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        defaultUserId={userId}
      />
    </div>
  );
}
