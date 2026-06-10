"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCRC } from "@/lib/utils";

interface RevenueChartProps {
  receipts: Array<{
    receiptDate: Date;
    amount: number;
  }>;
}

export function RevenueChart({ receipts }: RevenueChartProps) {
  // Agrupar ingresos por mes
  const monthlyData = receipts.reduce((acc, receipt) => {
    const date = new Date(receipt.receiptDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = acc.find((item) => item.month === monthKey);

    if (existing) {
      existing.total += receipt.amount;
    } else {
      acc.push({
        month: monthKey,
        total: receipt.amount,
        label: new Date(date.getFullYear(), date.getMonth()).toLocaleDateString("es-CR", {
          month: "short",
          year: "2-digit",
        }),
      });
    }

    return acc;
  }, [] as Array<{ month: string; total: number; label: string }>);

  // Ordenar por mes
  monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{payload[0].payload.label}</p>
          <p className="text-sm text-green-600 font-bold">
            {formatCRC(payload[0].value, 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por Mes</CardTitle>
      </CardHeader>
      <CardContent>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: "#16a34a", r: 4 }}
                activeDot={{ r: 6 }}
                name="Ingresos"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay datos de ingresos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
