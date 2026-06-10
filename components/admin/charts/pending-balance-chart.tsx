"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
    .slice(0, 8); // Top 8 deudores

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{payload[0].payload.client}</p>
          <p className="text-sm font-bold text-orange-600">
            Debe: {formatCRC(payload[0].value, 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalPending = clientBalances.reduce((sum, item) => sum + item.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Pendiente por Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        {clientBalances.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientBalances} margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="client" type="category" width={115} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="balance" fill="#f97316" radius={[0, 8, 8, 0]} name="Saldo Pendiente" />
              </BarChart>
            </ResponsiveContainer>

            {/* Total pendiente */}
            <div className="mt-4 p-4 bg-orange-50 rounded border border-orange-200">
              <p className="text-sm text-gray-600">Total Pendiente por Cobrar</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCRC(totalPending, 0)}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay saldo pendiente
          </div>
        )}
      </CardContent>
    </Card>
  );
}
