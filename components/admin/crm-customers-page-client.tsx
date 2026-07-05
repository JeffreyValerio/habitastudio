"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, ArrowUpDown, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { getCustomers } from "@/app/actions/crm";
import { CrmCustomersTable } from "@/components/admin/crm-customers-table";
import { Input } from "@/components/ui/input";
import { formatCRC } from "@/lib/utils";

export function CrmCustomersPageClient() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "spent" | "interactions">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadCustomers = async () => {
      const data = await getCustomers();
      setCustomers(data);
      setLoading(false);
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      switch (sortBy) {
        case "name":
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case "date":
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
          break;
        case "spent":
          compareA = a.totalSpent || 0;
          compareB = b.totalSpent || 0;
          break;
        case "interactions":
          compareA = a._count?.interactions || 0;
          compareB = b._count?.interactions || 0;
          break;
        default:
          compareA = a.name;
          compareB = b.name;
      }

      return sortOrder === "asc"
        ? compareA > compareB ? 1 : -1
        : compareA < compareB ? 1 : -1;
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, sortBy, sortOrder]);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{filteredCustomers.length} de {customers.length} clientes</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/crm/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
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
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCRC(totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filtros y Ordenamiento</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-1 block">Buscar</label>
            <Input
              placeholder="Nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium mb-1 block">Ordenar por</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="name">Nombre</option>
                <option value="date">Fecha</option>
                <option value="spent">Gastado</option>
                <option value="interactions">Interacciones</option>
              </select>
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

      {/* Customers Grid */}
      <CrmCustomersTable customers={filteredCustomers} />
    </div>
  );
}
