import { getCurrentUser } from "@/lib/auth";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { PendingInvitationsList } from "@/components/admin/pending-invitations-list";
import { getPendingInvitations } from "@/app/actions/invitations";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default async function UsersPage() {
  const user = await getCurrentUser();
  const invitations = await getPendingInvitations();

  // Solo administradores pueden gestionar usuarios
  if (!user || user.role !== "admin") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Invita a otros usuarios a tu equipo
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Acceso Restringido
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Solo los administradores pueden gestionar usuarios e invitaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <PendingInvitationsList invitations={invitations || []} />
        </div>
      </div>
    </div>
  );
}
