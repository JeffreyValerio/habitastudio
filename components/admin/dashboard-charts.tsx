"use client";

import { useState } from "react";
import { RevenueChart } from "./charts/revenue-chart";
import { SalesFunnelChart } from "./charts/sales-funnel-chart";
import { TopProductsChart } from "./charts/top-products-chart";
import { PendingBalanceChart } from "./charts/pending-balance-chart";
import { DateFilter, DateRange } from "./charts/date-filter";

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
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    return { startDate, endDate };
  });

  // Filtrar datos por fecha
  const filteredReceipts = receipts.filter((r) => {
    const date = new Date(r.receiptDate);
    return date >= dateRange.startDate && date <= dateRange.endDate;
  });

  const filteredQuotes = quotes.filter((q) => {
    const date = new Date(q.createdAt);
    return date >= dateRange.startDate && date <= dateRange.endDate;
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Análisis y Tendencias</h2>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart receipts={filteredReceipts} />
        <SalesFunnelChart quotes={filteredQuotes} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart quotes={filteredQuotes} />
        <PendingBalanceChart quotes={filteredQuotes} receipts={filteredReceipts} />
      </div>
    </div>
  );
}
