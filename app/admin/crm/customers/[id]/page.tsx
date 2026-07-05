import { getCustomer } from "@/app/actions/crm";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import Link from "next/link";
import { Mail, Phone, MapPin, Building2, Briefcase, TrendingUp, MessageCircle, FileText } from "lucide-react";
import { formatCRC } from "@/lib/utils";
import { CustomerDetailActions } from "@/components/admin/customer-detail-actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return <RestrictedAccess message="Solo los administradores pueden ver clientes." />;
  }

  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  const statusConfig = {
    prospect: { label: "Prospecto", color: "bg-gray-100 text-gray-800" },
    qualified: { label: "Calificado", color: "bg-blue-100 text-blue-800" },
    negotiation: { label: "Negociación", color: "bg-amber-100 text-amber-800" },
    customer: { label: "Cliente", color: "bg-green-100 text-green-800" },
    inactive: { label: "Inactivo", color: "bg-red-100 text-red-800" },
  };

  const status = statusConfig[customer.status as keyof typeof statusConfig];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          {customer.company && (
            <p className="text-muted-foreground">{customer.company}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/admin/crm/customers/${customer.id}/edit`}>Editar</Link>
        </Button>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <a href={`mailto:${customer.email}`} className="text-sm hover:underline">
                  {customer.email}
                </a>
              </div>
            </div>
            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <a href={`tel:${customer.phone}`} className="text-sm hover:underline">
                    {customer.phone}
                  </a>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm">{customer.address}</p>
                </div>
              </div>
            )}
            {customer.city && (
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Ciudad</p>
                  <p className="text-sm">{customer.city}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Cotizaciones</p>
              <p className="text-2xl font-bold">{customer._count.quotes}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Interacciones</p>
              <p className="text-2xl font-bold">{customer._count.interactions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gastado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCRC(customer.totalSpent)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CRM Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CRM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.source && (
              <div>
                <p className="text-xs text-muted-foreground">Fuente</p>
                <p className="text-sm font-medium">{customer.source}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${customer.score}%` }}
                  />
                </div>
                <p className="text-sm font-bold">{customer.score}</p>
              </div>
            </div>
            {customer.lastInteraction && (
              <div>
                <p className="text-xs text-muted-foreground">Última Interacción</p>
                <p className="text-sm">
                  {new Date(customer.lastInteraction).toLocaleDateString("es-CR")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quotes */}
      {customer.quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cotizaciones ({customer.quotes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customer.quotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/admin/quotes/${quote.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">#{quote.quoteNumber}</p>
                    <p className="text-sm text-muted-foreground">{quote.projectName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{quote.status}</Badge>
                    <p className="text-sm font-bold mt-1">{formatCRC(quote.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <CustomerDetailActions customerId={customer.id} />
    </div>
  );
}
