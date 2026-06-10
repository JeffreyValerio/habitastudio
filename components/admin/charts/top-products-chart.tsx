"use client";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="px-3 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{product.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No hay datos de productos en cotizaciones aceptadas
          </div>
        )}
      </CardContent>
    </Card>
  );
}
