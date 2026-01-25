import { getProducts } from "@/app/actions/products";
import { getServices } from "@/app/actions/services";
import { getProjects } from "@/app/actions/projects";
import { getQuotes } from "@/app/actions/quotes";
import { getReceipts } from "@/app/actions/receipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, FolderKanban, FileText, TrendingUp, DollarSign, Receipt, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [products, services, projects, quotes, receipts] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
    getQuotes(),
    getReceipts(),
  ]);

  // Calcular estadísticas de cotizaciones
  const totalQuotes = quotes.length;
  const sentQuotes = quotes.filter((q) => q.status === "sent").length;
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted").length;
  const draftQuotes = quotes.filter((q) => q.status === "draft").length;
  const totalValue = quotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + q.total, 0);

  // Calcular estadísticas de recibos
  const totalReceipts = receipts.length;
  const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
  const pendingBalance = Math.max(0, acceptedValue - totalReceived);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

      {/* KPIs principales de finanzas - Destacados */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Cotizado */}
          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Cotizado</CardTitle>
                <ArrowUpCircle className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }).format(totalValue)}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalQuotes} cotizaciones en total
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedQuotes} aceptadas • {sentQuotes} enviadas • {draftQuotes} borradores
              </p>
              <Link href="/admin/quotes" className="text-sm text-blue-600 hover:underline mt-3 inline-block font-medium">
                Ver cotizaciones →
              </Link>
            </CardContent>
          </Card>

          {/* Total Recibido */}
          <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Total Recibido</CardTitle>
                <ArrowDownCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }).format(totalReceived)}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalReceipts} recibos registrados
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pagos y adelantos recibidos
              </p>
              <Link href="/admin/receipts" className="text-sm text-green-600 hover:underline mt-3 inline-block font-medium">
                Ver recibos →
              </Link>
            </CardContent>
          </Card>

          {/* Saldo Pendiente */}
          <Card className={`border-2 ${pendingBalance > 0 ? 'border-orange-200' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Saldo Pendiente</CardTitle>
                <Receipt className={`h-6 w-6 ${pendingBalance > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-2 ${pendingBalance > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }).format(pendingBalance)}
              </div>
              <p className="text-sm text-muted-foreground">
                Por recibir de cotizaciones aceptadas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {acceptedValue > 0 ? `${((totalReceived / acceptedValue) * 100).toFixed(1)}% recibido` : 'Sin cotizaciones aceptadas'}
              </p>
              {pendingBalance > 0 && (
                <Link href="/admin/receipts/new" className="text-sm text-orange-600 hover:underline mt-3 inline-block font-medium">
                  Registrar pago →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPIs de recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Productos en catálogo
            </p>
            <Link href="/admin/products" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar productos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Servicios</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Servicios disponibles
            </p>
            <Link href="/admin/services" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar servicios →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proyectos</CardTitle>
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Proyectos realizados
            </p>
            <Link href="/admin/projects" className="text-sm text-primary hover:underline mt-2 inline-block">
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
            <Link href="/admin/quotes" className="text-sm text-primary hover:underline mt-2 inline-block">
              Gestionar cotizaciones →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas detalladas */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Estadísticas Detalladas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Valor Aceptado</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }).format(acceptedValue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {acceptedQuotes} cotizaciones aceptadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Enviadas</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{sentQuotes}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Cotizaciones enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Borradores</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{draftQuotes}</div>
              <p className="text-sm text-muted-foreground mt-1">
                En borrador
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recibos</CardTitle>
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalReceipts}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Recibos registrados
              </p>
              <Link href="/admin/receipts" className="text-sm text-primary hover:underline mt-2 inline-block">
                Gestionar recibos →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cotizaciones recientes */}
      {quotes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Cotizaciones Recientes</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {quotes.slice(0, 5).map((quote) => (
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
                      <div className="font-bold">
                        {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: "CRC",
                          maximumFractionDigits: 0,
                        }).format(quote.total)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.createdAt).toLocaleDateString("es-CR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {quotes.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/admin/quotes"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver todas las cotizaciones →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

