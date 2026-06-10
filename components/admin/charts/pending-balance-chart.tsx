"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";

interface PendingBalanceChartProps {
  quotes: Array<{
    id: string;
    clientName: string;
    total: number;
    status: string;
  }>;
  receipts: Array<{
    quoteId: string;
    amount: number;
  }>;
}

export function PendingBalanceChart({ quotes, receipts }: PendingBalanceChartProps) {
  // Calcular saldo por cliente (solo cotizaciones aceptadas)
  const receiptsByQuote = receipts.reduce(
    (acc, receipt) => {
      acc[receipt.quoteId] = (acc[receipt.quoteId] || 0) + receipt.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const clientBalances = quotes
    .filter((q) => q.status === "accepted")
    .map((quote) => {
      const totalPaid = receiptsByQuote[quote.id] || 0;
      const balance = Math.max(0, quote.total - totalPaid);
      return {
        client: quote.clientName,
        balance,
        total: quote.total,
      };
    })
    .filter((item) => item.balance > 0) // Solo con deuda
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5); // Top 5 deudores

  const totalPending = clientBalances.reduce((sum, item) => sum + item.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Pendiente por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        {clientBalances.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {clientBalances.map((item, index) => (
                <div key={item.client} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.client}</p>
                      <p className="text-xs text-gray-400">De {formatCRC(item.total, 0)}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-orange-400">
                      {formatCRC(item.balance, 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total pendiente */}
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-600">Total Pendiente por Cobrar</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCRC(totalPending, 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No hay saldo pendiente
          </div>
        )}
      </CardContent>
    </Card>
  );
}
