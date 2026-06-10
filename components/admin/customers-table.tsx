"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  totalQuoted: number;
  totalPaid: number;
  quotesCount: number;
  acceptedCount: number;
  receiptsCount: number;
  lastQuoteDate: string;
}

interface CustomersTableProps {
  customers: Customer[];
}

type SortField = "name" | "revenue" | "pending" | "paymentRate" | "lastQuote";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export function CustomersTable({ customers }: CustomersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.clientName.toLowerCase().includes(searchLower) ||
          c.clientEmail?.toLowerCase().includes(searchLower) ||
          c.clientPhone?.includes(search)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => {
        const pending = c.totalQuoted - c.totalPaid;
        switch (statusFilter) {
          case "prospect":
            return c.quotesCount === 0;
          case "quoted":
            return c.quotesCount > 0 && c.acceptedCount === 0;
          case "accepted":
            return c.acceptedCount > 0 && c.totalPaid === 0;
          case "paid":
            return c.totalPaid > 0;
          case "atRisk":
            return pending > 0 && c.totalPaid === 0;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "name":
          aVal = a.clientName;
          bVal = b.clientName;
          break;
        case "revenue":
          aVal = a.totalQuoted;
          bVal = b.totalQuoted;
          break;
        case "pending":
          aVal = a.totalQuoted - a.totalPaid;
          bVal = b.totalQuoted - b.totalPaid;
          break;
        case "paymentRate":
          aVal =
            a.totalQuoted > 0 ? a.totalPaid / a.totalQuoted : 0;
          bVal =
            b.totalQuoted > 0 ? b.totalPaid / b.totalQuoted : 0;
          break;
        case "lastQuote":
          aVal = new Date(a.lastQuoteDate as string).getTime();
          bVal = new Date(b.lastQuoteDate as string).getTime();
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [customers, search, statusFilter, sortField, sortDirection]);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              className="pl-8"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="prospect">Prospectos</SelectItem>
                <SelectItem value="quoted">Cotizados</SelectItem>
                <SelectItem value="accepted">Aceptados</SelectItem>
                <SelectItem value="paid">Pagados</SelectItem>
                <SelectItem value="atRisk">En riesgo (sin pagar)</SelectItem>
              </SelectContent>
            </Select>
            {filteredCustomers.length !== customers.length && (
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredCustomers.length} de {customers.length} clientes
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {customers.length === 0
                ? "No hay clientes registrados"
                : "No se encontraron clientes"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-accent"
                    onClick={() => toggleSort("name")}
                  >
                    Cliente <SortIcon field="name" />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Contacto
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-accent"
                    onClick={() => toggleSort("revenue")}
                  >
                    Total Cotizado <SortIcon field="revenue" />
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    Total Pagado
                  </th>
                  <th
                    className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-accent"
                    onClick={() => toggleSort("pending")}
                  >
                    Pendiente <SortIcon field="pending" />
                  </th>
                  <th
                    className="text-center py-3 px-4 font-semibold cursor-pointer hover:bg-accent"
                    onClick={() => toggleSort("paymentRate")}
                  >
                    % Pagado <SortIcon field="paymentRate" />
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    Cotizaciones
                  </th>
                  <th
                    className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-accent"
                    onClick={() => toggleSort("lastQuote")}
                  >
                    Última Cotización <SortIcon field="lastQuote" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => {
                  const pending = customer.totalQuoted - customer.totalPaid;
                  const paymentRate =
                    customer.totalQuoted > 0
                      ? ((customer.totalPaid / customer.totalQuoted) * 100).toFixed(1)
                      : 0;

                  return (
                    <tr
                      key={customer.clientName}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(customer.clientName)}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {customer.clientName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="text-xs space-y-1">
                          {customer.clientEmail && (
                            <div>{customer.clientEmail}</div>
                          )}
                          {customer.clientPhone && (
                            <div>{customer.clientPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCRC(customer.totalQuoted, 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        {formatCRC(customer.totalPaid, 0)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          pending > 0 ? "text-orange-600" : "text-muted-foreground"
                        }`}
                      >
                        {formatCRC(pending, 0)}
                      </td>
                      <td className="py-3 px-4 text-center text-purple-600 font-medium">
                        {paymentRate}%
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {customer.quotesCount}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(customer.lastQuoteDate as string).toLocaleDateString(
                          "es-CR"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} de{" "}
              {filteredCustomers.length} clientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
