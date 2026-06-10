"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesFunnelChartProps {
  quotes: Array<{
    status: string;
  }>;
}

export function SalesFunnelChart({ quotes }: SalesFunnelChartProps) {
  const total = quotes.length;
  const sent = quotes.filter((q) => q.status === "sent").length;
  const accepted = quotes.filter((q) => q.status === "accepted").length;
  const rejected = quotes.filter((q) => q.status === "rejected").length;

  const data = [
    {
      stage: "Enviadas",
      count: sent,
      percentage: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
      color: "#3b82f6",
    },
    {
      stage: "Aceptadas",
      count: accepted,
      percentage: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0,
      color: "#10b981",
    },
    {
      stage: "Rechazadas",
      count: rejected,
      percentage: total > 0 ? ((rejected / total) * 100).toFixed(1) : 0,
      color: "#ef4444",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-semibold">{data.stage}</p>
          <p className="text-sm font-bold" style={{ color: data.color }}>
            {data.count} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Estadísticas debajo */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Tasa Envío</p>
                <p className="text-2xl font-bold text-blue-600">
                  {total > 0 ? ((sent / total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Tasa Aceptación</p>
                <p className="text-2xl font-bold text-green-600">
                  {sent > 0 ? ((accepted / sent) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <p className="text-sm text-gray-600">Tasa Rechazo</p>
                <p className="text-2xl font-bold text-red-600">
                  {sent > 0 ? ((rejected / sent) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay datos de cotizaciones
          </div>
        )}
      </CardContent>
    </Card>
  );
}
