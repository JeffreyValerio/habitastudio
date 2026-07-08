import { UserCreationPanel } from "@/components/admin/user-creation-panel";
import { PendingInvitationsList } from "@/components/admin/pending-invitations-list";
import { UsersTable } from "@/components/admin/users-table";
import { getPendingInvitations } from "@/app/actions/invitations";
import { getUsers } from "@/app/actions/users";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { getSectionAccess } from "@/app/actions/role-permissions";

export default async function UsersPage() {
  const { allowed } = await getSectionAccess("admin.settings.users");

  if (!allowed) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Invita a otros usuarios a tu equipo
          </p>
        </div>

        <RestrictedAccess message="No tienes permiso para gestionar usuarios e invitaciones." />
      </div>
    );
  }

  const [invitations, users] = await Promise.all([
    getPendingInvitations(),
    getUsers(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestionar Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Invita a otros usuarios a tu equipo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <UserCreationPanel />
        </div>

        <div className="lg:col-span-2">
          <PendingInvitationsList invitations={invitations || []} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Usuarios Activos</h2>
        <UsersTable users={users} />
      </div>
    </div>
  );
}
