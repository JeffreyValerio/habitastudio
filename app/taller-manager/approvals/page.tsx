import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/app/actions/timesheet";
import { ApprovalCard } from "@/components/taller-manager/approval-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "taller-manager") {
    redirect("/admin/login");
  }

  const pendingApprovals = await getPendingApprovals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprobaciones Pendientes</h1>
        <p className="text-muted-foreground mt-2">
          {pendingApprovals.length} solicitud{pendingApprovals.length !== 1 ? "es" : ""} por revisar
        </p>
      </div>

      {pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <p>No hay solicitudes pendientes</p>
            <p className="text-sm mt-2">
              Se mostrarán las solicitudes de entrada/salida de colaboradores aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingApprovals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}
