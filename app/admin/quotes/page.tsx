"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, CheckCircle, Clock, AlertCircle, DollarSign, Filter, ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getQuotes } from "@/app/actions/quotes";
import { QuotesTable } from "@/components/admin/quotes-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/admin/search-input";
import { formatCRC } from "@/lib/utils";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function QuotesPage() {
  const now = new Date();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "number">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const yearOptions = Array.from(
    new Set([
      now.getFullYear(),
      ...quotes.map((q) => new Date(q.createdAt).getFullYear()),
    ])
  ).sort((a, b) => b - a);

  useEffect(() => {
    const loadQuotes = async () => {
      const data = await getQuotes();
      setQuotes(data);
      setLoading(false);
    };
    loadQuotes();
  }, []);

  useEffect(() => {
    let filtered = [...quotes];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.quoteNumber.toLowerCase().includes(term) ||
        q.clientName.toLowerCase().includes(term) ||
        q.clientEmail?.toLowerCase().includes(term) ||
        q.projectName.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(q => q.status === statusFilter);
    }

    // Month/Year filter - se ignora mientras haya una búsqueda activa
    if (!searchTerm) {
      if (monthFilter !== "all") {
        const month = parseInt(monthFilter);
        filtered = filtered.filter(q => new Date(q.createdAt).getMonth() === month);
      }
      if (yearFilter !== "all") {
        const year = parseInt(yearFilter);
        filtered = filtered.filter(q => new Date(q.createdAt).getFullYear() === year);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      switch (sortBy) {
        case "date":
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
          break;
        case "amount":
          compareA = a.total;
          compareB = b.total;
          break;
        case "number":
          compareA = parseInt(a.quoteNumber);
          compareB = parseInt(b.quoteNumber);
          break;
        default:
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
      }

      return sortOrder === "asc"
        ? compareA > compareB ? 1 : -1
        : compareA < compareB ? 1 : -1;
    });

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter, monthFilter, yearFilter, sortBy, sortOrder]);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  // Calculate KPIs from filtered quotes
  const totalQuotes = filteredQuotes.length;
  const totalValue = filteredQuotes.reduce((sum, q) => sum + q.total, 0);
  const acceptedQuotes = filteredQuotes.filter((q) => q.status === "accepted");
  const conversionRate =
    totalQuotes > 0 ? ((acceptedQuotes.length / totalQuotes) * 100).toFixed(1) : "0";
  const acceptedValue = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);
  const pendingQuotes = filteredQuotes.filter((q) => q.status === "draft" || q.status === "sent");

  // Group by status
  const byStatus = {
    draft: filteredQuotes.filter((q) => q.status === "draft"),
    sent: filteredQuotes.filter((q) => q.status === "sent"),
    accepted: acceptedQuotes,
    rejected: filteredQuotes.filter((q) => q.status === "rejected"),
    expired: filteredQuotes.filter((q) => q.status === "expired"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">{filteredQuotes.length} de {quotes.length} cotizaciones</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/quotes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotización
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filtros y Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-1 block">Buscar</label>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Nº, cliente, proyecto..."
              className="max-w-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Estado</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Mes</label>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MONTH_NAMES.map((name, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Año</label>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium mb-1 block">Ordenar por</label>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="amount">Monto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 border rounded-md hover:bg-accent transition-colors"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalQuotes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCRC(totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Aceptadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {acceptedQuotes.length}
              </p>
              <p className="text-xs text-muted-foreground">{conversionRate}% conversión</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Valor Aceptado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCRC(acceptedValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingQuotes.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pipeline de Cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Borradores", count: byStatus.draft.length, color: "bg-gray-100 dark:bg-gray-800", textColor: "text-gray-700 dark:text-gray-300" },
              { label: "Enviadas", count: byStatus.sent.length, color: "bg-blue-100 dark:bg-blue-900", textColor: "text-blue-700 dark:text-blue-300" },
              { label: "Aceptadas", count: byStatus.accepted.length, color: "bg-green-100 dark:bg-green-900", textColor: "text-green-700 dark:text-green-300" },
              { label: "Rechazadas", count: byStatus.rejected.length, color: "bg-red-100 dark:bg-red-900", textColor: "text-red-700 dark:text-red-300" },
              { label: "Expiradas", count: byStatus.expired.length, color: "bg-orange-100 dark:bg-orange-900", textColor: "text-orange-700 dark:text-orange-300" },
            ].map((stage) => (
              <div key={stage.label} className={`${stage.color} rounded-lg p-4 text-center`}>
                <p className={`text-2xl font-bold ${stage.textColor}`}>{stage.count}</p>
                <p className="text-sm text-muted-foreground mt-1">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quotes Grid */}
      <QuotesTable quotes={filteredQuotes} />
    </div>
  );
}
