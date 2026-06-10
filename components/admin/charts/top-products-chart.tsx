"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopProductsChartProps {
  quotes: Array<{
    status: string;
    items: Array<{
      description: string;
      quantity: number;
    }>;
  }>;
}

export function TopProductsChart({ quotes }: TopProductsChartProps) {
  // Solo cotizaciones aceptadas
  const acceptedQuotes = quotes.filter((q) => q.status === "accepted");

  // Contar productos
  const productCounts = acceptedQuotes.reduce(
    (acc, quote) => {
      quote.items.forEach((item) => {
        const existing = acc.find((p) => p.name === item.description);
        if (existing) {
          existing.count += item.quantity;
        } else {
          acc.push({
            name: item.description,
            count: item.quantity,
          });
        }
      });
      return acc;
    },
    [] as Array<{ name: string; count: number }>
  );

  // Top 5
  const topProducts = productCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{payload[0].payload.name}</p>
          <p className="text-sm font-bold text-blue-600">{payload[0].value} unidades</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={145} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay datos de productos en cotizaciones aceptadas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
