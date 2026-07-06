"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollaboratorsTable } from "@/components/admin/collaborators-table";
import { getCollaboratorsWithEarnings } from "@/app/actions/timesheet";
import { formatCRC } from "@/lib/utils";
import { Users, Plus, Clock, DollarSign, Filter } from "lucide-react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface CollaboratorEarnings {
  id: string;
  name: string | null;
  email: string;
  hourlyRate: number | null;
  createdAt: Date;
  hours: number;
  earned: number;
}

export function TimeManagementDashboard({ role }: { role: string }) {
  const canRegisterHours = role === "admin" || role === "moderator";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quincena, setQuincena] = useState<"all" | "1" | "2">("all");
  const [data, setData] = useState<CollaboratorEarnings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getCollaboratorsWithEarnings({
          year,
          month,
          quincena: quincena === "all" ? undefined : (parseInt(quincena) as 1 | 2),
        });
        setData(result);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month, quincena]);

  const totalHours = data.reduce((sum, c) => sum + c.hours, 0);
  const totalEarned = data.reduce((sum, c) => sum + c.earned, 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const quincenaLabel = {
    all: "Mes completo",
    "1": "1ra Quincena (1-15)",
    "2": "2da Quincena (16-fin)",
  }[quincena];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tiempo</h1>
          <p className="text-muted-foreground mt-2">
            Administra las horas y nómina de tus colaboradores
          </p>
        </div>
        {canRegisterHours && (
          <Button asChild size="lg">
            <Link href="/admin/time-management/new">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Horas
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Período de Pago</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Año</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Quincena</label>
              <select
                value={quincena}
                onChange={(e) => setQuincena(e.target.value as "all" | "1" | "2")}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="all">Mes completo</option>
                <option value="1">1ra Quincena (1-15)</option>
                <option value="2">2da Quincena (16-fin)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horas Trabajadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            <p className="text-xs text-muted-foreground mt-1">{quincenaLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCRC(totalEarned)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{quincenaLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Colaboradores */}
      <div>
        <h2 className="text-xl font-bold mb-4">Colaboradores</h2>
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Cargando...
            </CardContent>
          </Card>
        ) : (
          <CollaboratorsTable collaborators={data} rateYear={year} rateMonth={month} role={role} />
        )}
      </div>
    </div>
  );
}
