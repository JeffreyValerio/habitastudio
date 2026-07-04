"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCRC } from "@/lib/utils";
import { Mail, Phone, MapPin, Eye, Trash2, Search } from "lucide-react";
import { deleteCustomer } from "@/app/actions/crm";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

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

export function CustomersGrid({ customers }: { customers: Customer[] }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o empresa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No hay clientes aún
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const status = statusConfig[customer.status as keyof typeof statusConfig];
            const lastInteractionDate = customer.lastInteraction
              ? new Date(customer.lastInteraction).toLocaleDateString("es-CR")
              : "Sin interacciones";

            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{customer.name}</h3>
                      {customer.company && (
                        <p className="text-sm text-muted-foreground truncate">
                          {customer.company}
                        </p>
                      )}
                      <Badge className={`mt-2 ${status.color}`}>{status.label}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${customer.email}`} className="hover:text-foreground break-all">
                        {customer.email}
                      </a>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${customer.phone}`} className="hover:text-foreground">
                          {customer.phone}
                        </a>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {customer.city}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Cotizaciones</p>
                      <p className="text-lg font-bold">{customer._count.quotes}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interacciones</p>
                      <p className="text-lg font-bold">{customer._count.interactions}</p>
                    </div>
                  </div>

                  {/* Value & Last Interaction */}
                  {customer.totalSpent > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 rounded p-2">
                      <p className="text-xs text-muted-foreground">Gastado</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCRC(customer.totalSpent)}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Última interacción: {lastInteractionDate}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/admin/crm/customers/${customer.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Ver
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                      disabled={deleting === customer.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
