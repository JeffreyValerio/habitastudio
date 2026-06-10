import Link from "next/link";
import { getCustomers } from "@/app/actions/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";
import { Users, TrendingUp } from "lucide-react";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-gray-400 mt-2">
          {customers.length} clientes en total
        </p>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No hay clientes registrados
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {customers.map((customer) => {
            const pendingBalance = customer.totalQuoted - customer.totalPaid;
            const paymentRate =
              customer.totalQuoted > 0
                ? ((customer.totalPaid / customer.totalQuoted) * 100).toFixed(1)
                : 0;

            return (
              <Link key={customer.clientName} href={`/admin/customers/${encodeURIComponent(customer.clientName)}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {customer.clientName}
                        </h3>
                        {customer.clientEmail && (
                          <p className="text-sm text-gray-400 mt-1">
                            {customer.clientEmail}
                          </p>
                        )}
                        {customer.clientPhone && (
                          <p className="text-sm text-gray-400">
                            {customer.clientPhone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {customer.quotesCount} cotizaciones
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Total Cotizado</p>
                        <p className="text-lg font-bold text-blue-400 mt-1">
                          {formatCRC(customer.totalQuoted, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Total Pagado</p>
                        <p className="text-lg font-bold text-green-400 mt-1">
                          {formatCRC(customer.totalPaid, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Saldo</p>
                        <p
                          className={`text-lg font-bold mt-1 ${
                            pendingBalance > 0 ? "text-orange-400" : "text-gray-400"
                          }`}
                        >
                          {formatCRC(pendingBalance, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Pagado %</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-4 w-4 text-purple-400" />
                          <span className="text-lg font-bold text-purple-400">
                            {paymentRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-4 border-t pt-4">
                      Última cotización:{" "}
                      {new Date(customer.lastQuoteDate).toLocaleDateString(
                        "es-CR"
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
