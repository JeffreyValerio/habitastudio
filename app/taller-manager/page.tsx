import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/app/actions/timesheet";
import { TimeClock } from "@/components/collaborator/time-clock";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, AlertCircle, Clock, DollarSign, Calendar } from "lucide-react";

export default async function TallerManagerDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== "taller-manager") {
    redirect("/admin/login");
  }

  const pendingApprovals = await getPendingApprovals();

  // Get manager's hours today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEntries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      entryDate: { gte: today, lt: tomorrow },
      exitTime: { not: null },
    },
  });

  const hoursToday = todayEntries.reduce((sum, entry) => {
    if (entry.exitTime) {
      const diff = entry.exitTime.getTime() - entry.entryTime.getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  // Get manager's hours this month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const monthEntries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      entryDate: { gte: monthStart, lte: monthEnd },
      exitTime: { not: null },
    },
  });

  const hoursThisMonth = monthEntries.reduce((sum, entry) => {
    if (entry.exitTime) {
      const diff = entry.exitTime.getTime() - entry.entryTime.getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  // Get manager's hourly rate
  const manager = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hourlyRate: true },
  });

  const estimatedSalary = hoursThisMonth * (manager?.hourlyRate || 0);

  const pendingCount = pendingApprovals.length;
  const entryCount = pendingApprovals.filter((a) => a.type === "entry").length;
  const exitCount = pendingApprovals.filter((a) => a.type === "exit").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">¡Bienvenido, {user.name}!</h1>
        <p className="text-muted-foreground mt-2">
          Panel de jefe de taller
        </p>
      </div>

      {/* Reloj */}
      <TimeClock />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{hoursToday.toFixed(1)}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₡{estimatedSalary.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">por aprobar</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entradas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{entryCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Salidas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{exitCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
