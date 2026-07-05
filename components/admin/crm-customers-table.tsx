"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCRC } from "@/lib/utils";
import { Eye, Trash2 } from "lucide-react";
import { deleteCustomer } from "@/app/actions/crm";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 15;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  status: string;
  totalSpent: number;
  lastInteraction?: Date | null;
  _count: {
    quotes: number;
    interactions: number;
  };
}

const statusConfig = {
  prospect: { label: "Prospecto", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  qualified: { label: "Calificado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  negotiation: { label: "Negociación", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  customer: { label: "Cliente", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  inactive: { label: "Inactivo", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function CrmCustomersTable({ customers }: { customers: Customer[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [customers]);

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteCustomer(id);
      toast({ title: "Éxito", description: "Cliente eliminado" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar cliente?",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay clientes aún
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold">Contacto</th>
              <th className="text-left py-3 px-4 font-semibold">Estado</th>
              <th className="text-right py-3 px-4 font-semibold">Cotizaciones</th>
              <th className="text-right py-3 px-4 font-semibold">Interacciones</th>
              <th className="text-right py-3 px-4 font-semibold">Gastado</th>
              <th className="text-right py-3 px-4 font-semibold">Última Interacción</th>
              <th className="text-right py-3 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((customer) => {
              const status = statusConfig[customer.status as keyof typeof statusConfig];
              const lastInteractionDate = customer.lastInteraction
                ? new Date(customer.lastInteraction).toLocaleDateString("es-CR")
                : "Sin interacciones";

              return (
                <tr key={customer.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{customer.name}</p>
                    {customer.company && (
                      <p className="text-xs text-muted-foreground">{customer.company}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    <a href={`mailto:${customer.email}`} className="hover:text-foreground block">
                      {customer.email}
                    </a>
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`} className="hover:text-foreground block">
                        {customer.phone}
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={status.color}>{status.label}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">{customer._count.quotes}</td>
                  <td className="py-3 px-4 text-right font-semibold">{customer._count.interactions}</td>
                  <td className="py-3 px-4 text-right">
                    {customer.totalSpent > 0 ? (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCRC(customer.totalSpent)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                    {lastInteractionDate}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/crm/customers/${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                        disabled={deleting === customer.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </Card>
  );
}
