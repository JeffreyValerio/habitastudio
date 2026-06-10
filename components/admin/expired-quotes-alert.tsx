"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatCRC } from "@/lib/utils";

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  projectName: string;
  total: number;
  validUntil: Date | null;
}

interface ExpiredQuotesAlertProps {
  quotes: Quote[];
}

export function ExpiredQuotesAlert({ quotes }: ExpiredQuotesAlertProps) {
  const [expanded, setExpanded] = useState(false);

  // Filtrar cotizaciones vencidas
  const expiredQuotes = quotes.filter((q) => {
    if (!q.validUntil || q.status !== "sent") return false;
    return new Date(q.validUntil) < new Date();
  });

  if (expiredQuotes.length === 0) {
    return null;
  }

  const daysSinceExpired = (date: Date | null) => {
    if (!date) return 0;
    const now = new Date();
    const expired = new Date(date);
    const diffTime = Math.abs(now.getTime() - expired.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="border-2 border-red-600 bg-slate-900">
      <CardHeader
        className="cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <CardTitle className="text-red-400">
                ⚠️ {expiredQuotes.length} Cotización{expiredQuotes.length !== 1 ? "es" : ""} Vencida{expiredQuotes.length !== 1 ? "s" : ""}
              </CardTitle>
              <p className="text-sm text-red-400 mt-1">
                Requieren seguimiento urgente
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-red-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-red-500" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 border-t pt-4">
            {expiredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-red-600"
              >
                <div className="flex-1">
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="font-semibold text-red-400 hover:text-red-300"
                  >
                    {quote.quoteNumber}
                  </Link>
                  <p className="text-sm text-gray-300 mt-1">
                    {quote.clientName} - {quote.projectName}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Vencida hace {daysSinceExpired(quote.validUntil)} días
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-200">
                    {formatCRC(quote.total, 0)}
                  </p>
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    className="text-xs text-red-600 hover:underline mt-2 inline-block"
                  >
                    Dar seguimiento →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
