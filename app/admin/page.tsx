import { getProducts } from "@/app/actions/products";
import { getServices } from "@/app/actions/services";
import { getProjects } from "@/app/actions/projects";
import { getQuotes } from "@/app/actions/quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, FolderKanban, FileText, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [products, services, projects, quotes] = await Promise.all([
    getProducts(),
    getServices(),
    getProjects(),
    getQuotes(),
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

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

      {/* Sección de estadísticas de cotizaciones */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Estadísticas de Cotizaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Total Valor</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }).format(totalValue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Valor total cotizado
              </p>
            </CardContent>
          </Card>

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

