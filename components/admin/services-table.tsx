"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteService } from "@/app/actions/services";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Edit } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/admin/search-input";

interface Service {
  id: string;
  title: string;
  description: string;
}

const ITEMS_PER_PAGE = 10;

export function ServicesTable({ services }: { services: Service[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteService(id);
      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el servicio",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar servicio?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    
    const query = searchQuery.toLowerCase().trim();
    return services.filter(
      (service) =>
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay servicios aún.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/services/new">Crear primer servicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar por título, slug, descripción..."
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredServices.length} resultado{filteredServices.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedServices.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.title}</TableCell>
              <TableCell className="max-w-md truncate">{service.description}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/services/${service.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(service.id)}
                    disabled={deleting === service.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

