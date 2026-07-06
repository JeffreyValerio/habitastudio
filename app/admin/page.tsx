import { getQuotes } from "@/app/actions/quotes";
import { getCRMAnalytics } from "@/app/actions/crm";
import { getTotalReceiptsAmount } from "@/app/actions/receipts";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";
import { formatCRC } from "@/lib/utils";
import Link from "next/link";
import { QuotesRevenueChart } from "@/components/admin/quotes-revenue-chart";
import { RestrictedAccess } from "@/components/admin/restricted-access";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <RestrictedAccess message="Inicia sesión para ver el dashboard." />
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  const [quotes, crmData, totalReceived] = await Promise.all([
    getQuotes(),
    isAdmin ? getCRMAnalytics() : Promise.resolve(null),
    getTotalReceiptsAmount(),
  ]);

  // Calculate metrics
  const totalQuotesValue = quotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
  const conversionRate =
    quotes.length > 0 ? ((acceptedQuotes.length / quotes.length) * 100).toFixed(1) : "0";
  const pendingQuotes = quotes.filter((q) => q.status === "draft" || q.status === "sent");
  const expiredQuotes = quotes.filter((q) => q.status === "expired");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de métricas clave y actividad
        </p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {crmData && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{crmData.totalCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {crmData.activeCustomers} activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCRC(crmData.totalValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor acumulado de clientes
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{quotes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionRate}% conversión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCRC(totalReceived)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pagos recibidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingQuotes.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Por seguimiento
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {expiredQuotes.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        {crmData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Interacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {crmData.thisMonthInteractions}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este mes
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolución de Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuotesRevenueChart />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Últimas Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quotes.slice(0, 5).map((quote) => (
                <Link
                  key={quote.id}
                  href={`/admin/quotes/${quote.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">#{quote.quoteNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {quote.clientName}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatCRC(quote.total)}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Pipeline de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Borradores", count: quotes.filter((q) => q.status === "draft").length },
                { label: "Enviadas", count: quotes.filter((q) => q.status === "sent").length },
                { label: "Aceptadas", count: acceptedQuotes.length },
                { label: "Rechazadas", count: quotes.filter((q) => q.status === "rejected").length },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center justify-between">
                  <p className="text-sm">{stage.label}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-20">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            quotes.length > 0 ? (stage.count / quotes.length) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-sm font-bold w-6 text-right">{stage.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats by Source */}
      {crmData && (
        <Card>
          <CardHeader>
            <CardTitle>Clientes por Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(crmData.bySource).map(([source, count]) => (
                <div
                  key={source}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 text-center"
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

