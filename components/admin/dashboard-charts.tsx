"use client";

import { RevenueChart } from "./charts/revenue-chart";
import { SalesFunnelChart } from "./charts/sales-funnel-chart";
import { TopProductsChart } from "./charts/top-products-chart";
import { PendingBalanceChart } from "./charts/pending-balance-chart";

interface DashboardChartsProps {
  quotes: Array<{
    id: string;
    clientName: string;
    total: number;
    status: string;
    createdAt: Date;
    items: Array<{
      description: string;
      quantity: number;
    }>;
  }>;
  receipts: Array<{
    quoteId: string;
    amount: number;
    receiptDate: Date;
  }>;
}

export function DashboardCharts({ quotes, receipts }: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Análisis y Tendencias</h2>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart receipts={receipts} />
        <SalesFunnelChart quotes={quotes} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart quotes={quotes} />
        <PendingBalanceChart quotes={quotes} receipts={receipts} />
      </div>
    </div>
  );
}
