"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText, Receipt } from "lucide-react";
import { DateFilter, DateRange } from "./charts/date-filter";
import { DashboardCharts } from "./dashboard-charts";

interface DashboardContentProps {
  products: any[];
  services: any[];
  projects: any[];
  quotes: any[];
  receipts: any[];
}

export function DashboardContent({
  products,
  services,
  projects,
  quotes,
  receipts,
}: DashboardContentProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    return { startDate, endDate };
  });

  // Filtrar datos por fecha
  const filteredReceipts = useMemo(
    () =>
      receipts.filter((r) => {
        const date = new Date(r.receiptDate);
        return date >= dateRange.startDate && date <= dateRange.endDate;
      }),
    [receipts, dateRange]
  );

  const filteredQuotes = useMemo(
    () =>
      quotes.filter((q) => {
        const date = new Date(q.createdAt);
        return date >= dateRange.startDate && date <= dateRange.endDate;
      }),
    [quotes, dateRange]
  );

  // Estadísticas de cotizaciones (filtradas)
  const totalQuotes = filteredQuotes.length;
  const sentQuotes = filteredQuotes.filter((q) => q.status === "sent").length;
  const acceptedQuotes = filteredQuotes.filter(
    (q) => q.status === "accepted"
  ).length;
  const draftQuotes = filteredQuotes.filter((q) => q.status === "draft").length;
  const totalValue = filteredQuotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedValue = filteredQuotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.total, 0);

  // Estadísticas de recibos (filtrados)
  const totalReceiptsCount = filteredReceipts.length;
  const totalReceived = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);
  const pendingBalance = Math.max(0, acceptedValue - totalReceived);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <DateFilter onDateRangeChange={setDateRange} />
      </div>

      {/* KPIs principales de finanzas - Destacados */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Cotizado */}
          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Cotizado</CardTitle>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatCRC(totalValue, 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalQuotes} cotizaciones
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedQuotes} aceptadas • {sentQuotes} enviadas • {draftQuotes}{" "}
                borradores
              </p>
              <Link
                href="/admin/quotes"
                className="text-sm text-blue-600 hover:underline mt-3 inline-block font-medium"
              >
                Ver cotizaciones →
              </Link>
            </CardContent>
          </Card>

          {/* Total Recibido */}
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Recibido</CardTitle>
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCRC(totalReceived, 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalReceiptsCount} recibos registrados
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pagos y adelantos recibidos
              </p>
              <Link
                href="/admin/receipts"
                className="text-sm text-green-600 hover:underline mt-3 inline-block font-medium"
              >
                Ver recibos →
              </Link>
            </CardContent>
          </Card>

          {/* Saldo Pendiente */}
          <Card
            className={`border-2 ${
              pendingBalance > 0 ? "border-orange-200" : "border-gray-200"
            } hover:shadow-lg transition-shadow`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Saldo Pendiente</CardTitle>
                <Receipt
                  className={`h-6 w-6 ${
                    pendingBalance > 0 ? "text-orange-600" : "text-gray-600"
                  }`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold mb-2 ${
                  pendingBalance > 0 ? "text-orange-600" : "text-gray-600"
                }`}
              >
                {formatCRC(pendingBalance, 0)}
              </div>
              <p className="text-sm text-muted-foreground">
                Por recibir de cotizaciones aceptadas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedValue > 0
                  ? `${((totalReceived / acceptedValue) * 100).toFixed(1)}% recibido`
                  : "Sin cotizaciones aceptadas"}
              </p>
              {pendingBalance > 0 && (
                <Link
                  href="/admin/receipts/new"
                  className="text-sm text-orange-600 hover:underline mt-3 inline-block font-medium"
                >
                  Registrar pago →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos de análisis con filtros */}
      <div className="mb-8">
        <DashboardCharts quotes={filteredQuotes} receipts={filteredReceipts} />
      </div>

      {/* KPIs de recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Productos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Productos en catálogo
            </p>
            <Link
              href="/admin/products"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Gestionar productos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Servicios</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Servicios disponibles
            </p>
            <Link
              href="/admin/services"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Gestionar servicios →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proyectos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Proyectos realizados
            </p>
            <Link
              href="/admin/projects"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Gestionar proyectos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cotizaciones</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total de cotizaciones
            </p>
            <Link
              href="/admin/quotes"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Gestionar cotizaciones →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Cotizaciones recientes */}
      {filteredQuotes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Cotizaciones Recientes</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredQuotes.slice(0, 5).map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/quotes/${quote.id}`}
                          className="font-semibold hover:underline"
                        >
                          {quote.quoteNumber}
                        </Link>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {quote.status === "draft" && "Borrador"}
                          {quote.status === "sent" && "Enviada"}
                          {quote.status === "accepted" && "Aceptada"}
                          {quote.status === "rejected" && "Rechazada"}
                          {quote.status === "expired" && "Expirada"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quote.clientName} - {quote.projectName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCRC(quote.total, 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
