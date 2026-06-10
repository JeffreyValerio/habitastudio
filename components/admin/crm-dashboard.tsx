"use client";

import { formatCRC } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  DollarSign,
  Hourglass,
  AlertCircle,
  UserX,
} from "lucide-react";
import Link from "next/link";

interface CRMDashboardProps {
  data: {
    kpis: {
      totalCustomers: number;
      activeCustomers: number;
      totalRevenue: number;
      totalPipeline: number;
    };
    pipeline: {
      prospect: number;
      quoted: number;
      accepted: number;
      paid: number;
    };
    topCustomers: Array<{
      clientName: string;
      totalQuoted: number;
      totalPaid: number;
    }>;
    customersWithExpiredQuotes: number;
    inactiveCustomers: Array<{
      clientName: string;
      lastQuoteDate: string;
    }>;
  };
}

export function CRMDashboard({ data }: CRMDashboardProps) {
  const conversionRate =
    data.kpis.totalCustomers > 0
      ? ((data.pipeline.paid / data.kpis.totalCustomers) * 100).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.kpis.totalCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.kpis.activeCustomers} activos (últimos 30 días)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCRC(data.kpis.totalRevenue, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total pagado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <Hourglass className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCRC(data.kpis.totalPipeline, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pendiente por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes con pago
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Stages */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">
                  {data.pipeline.prospect}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Prospectos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">
                  {data.pipeline.quoted}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Cotizados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">
                  {data.pipeline.accepted}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Aceptados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">
                  {data.pipeline.paid}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Pagados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-4">
          {data.customersWithExpiredQuotes > 0 && (
            <Card className="border-red-600 bg-red-50 dark:bg-red-950">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-sm text-red-600">
                    Cotizaciones Vencidas
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {data.customersWithExpiredQuotes}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Requieren seguimiento
                </p>
              </CardContent>
            </Card>
          )}

          {data.inactiveCustomers.length > 0 && (
            <Card className="border-gray-600 bg-gray-50 dark:bg-gray-950">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-gray-600" />
                  <CardTitle className="text-sm text-gray-600">
                    Clientes Inactivos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-600">
                  {data.inactiveCustomers.length}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Sin actividad &gt;30 días
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay clientes aún
            </p>
          ) : (
            <div className="space-y-4">
              {data.topCustomers.map((customer, idx) => (
                <Link
                  key={customer.clientName}
                  href={`/admin/customers/${encodeURIComponent(customer.clientName)}`}
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="font-medium text-sm">{customer.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">
                        {formatCRC(customer.totalQuoted, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pagado: {formatCRC(customer.totalPaid, 0)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
