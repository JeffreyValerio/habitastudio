import Link from "next/link";
import { getCustomerByName } from "@/app/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    name: string;
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const customer = await getCustomerByName(decodeURIComponent(params.name));

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/customers" className="text-blue-400 hover:text-blue-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{customer.clientName}</h1>
          <p className="text-gray-400 mt-1">Historial completo del cliente</p>
        </div>
      </div>

      {/* Información de contacto */}
      {(customer.clientEmail || customer.clientPhone || customer.clientAddress) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.clientEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${customer.clientEmail}`} className="text-blue-400 hover:underline">
                  {customer.clientEmail}
                </a>
              </div>
            )}
            {customer.clientPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${customer.clientPhone}`} className="text-blue-400 hover:underline">
                  {customer.clientPhone}
                </a>
              </div>
            )}
            {customer.clientAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <p className="text-gray-300">{customer.clientAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Cotizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">
              {formatCRC(customer.totalQuoted, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{customer.quotesCount} cotizaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {formatCRC(customer.totalPaid, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">{customer.receiptsCount} recibos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                customer.pendingBalance > 0 ? "text-orange-400" : "text-gray-400"
              }`}
            >
              {formatCRC(customer.pendingBalance, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Por cobrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasa de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-400">
              {customer.totalQuoted > 0
                ? ((customer.totalPaid / customer.totalQuoted) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-500 mt-2">Del total cotizado</p>
          </CardContent>
        </Card>
      </div>

      {/* Cotizaciones */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Cotizaciones</h2>
        <div className="space-y-3">
          {customer.quotes.map((quote) => (
            <Link key={quote.id} href={`/admin/quotes/${quote.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{quote.quoteNumber}</p>
                      <p className="text-sm text-gray-400">{quote.projectName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(quote.createdAt).toLocaleDateString("es-CR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCRC(quote.total, 0)}</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-800">
                        {quote.status === "draft" && "Borrador"}
                        {quote.status === "sent" && "Enviada"}
                        {quote.status === "accepted" && "Aceptada"}
                        {quote.status === "rejected" && "Rechazada"}
                        {quote.status === "expired" && "Expirada"}
                      </span>
                    </div>
                  </div>

                  {quote.receipts.length > 0 && (
                    <div className="mt-3 text-xs text-gray-400">
                      {quote.receipts.length} recibo(s): {formatCRC(
                        quote.receipts.reduce((sum, r) => sum + r.amount, 0),
                        0
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
