import { InviteUserForm } from "@/components/admin/invite-user-form";
import { PendingInvitationsList } from "@/components/admin/pending-invitations-list";
import { getPendingInvitations } from "@/app/actions/invitations";

export default async function UsersPage() {
  const invitations = await getPendingInvitations();

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
          <InviteUserForm />
        </div>

        <div className="lg:col-span-2">
          <PendingInvitationsList invitations={invitations} />
        </div>
      </div>
    </div>
  );
}
