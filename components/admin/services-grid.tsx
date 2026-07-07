"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteService } from "@/app/actions/services";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Edit, Zap, CheckCircle2, List } from "lucide-react";
import * as Icons from "lucide-react";
import { SearchInput } from "@/components/admin/search-input";

interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image?: string | null;
  features: string[];
  process: string[];
  benefits: string[];
  icon: string;
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 9;

export function ServicesGrid({ services }: { services: Service[] }) {
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

  const getIconComponent = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Zap;
    return Icon;
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
    <div className="space-y-6">
      {/* Búsqueda */}
      <div className="flex items-center gap-4">
        <SearchInput value={searchQuery} onChange={handleSearchChange} placeholder="Buscar servicios..." />
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredServices.length} resultado{filteredServices.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Grid de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedServices.map((service) => {
          const IconComponent = getIconComponent(service.icon);
          const truncatedDescription = service.description
            .split("\n")[0]
            .substring(0, 100) + (service.description.length > 100 ? "..." : "");

          return (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {service.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(service.createdAt).toLocaleDateString("es-CR")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4 flex-1 flex flex-col">
                {/* Descripción */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {truncatedDescription}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {service.benefits.length > 0 && (
                    <div className="text-center p-2 rounded-lg bg-accent">
                      <p className="text-lg font-bold text-primary">
                        {service.benefits.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Beneficios
                      </p>
                    </div>
                  )}
                  {service.features.length > 0 && (
                    <div className="text-center p-2 rounded-lg bg-accent">
                      <p className="text-lg font-bold text-primary">
                        {service.features.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Características
                      </p>
                    </div>
                  )}
                  {service.process.length > 0 && (
                    <div className="text-center p-2 rounded-lg bg-accent">
                      <p className="text-lg font-bold text-primary">
                        {service.process.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Pasos</p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/admin/services/${service.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    disabled={deleting === service.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredServices.length)} de{" "}
            {filteredServices.length} servicios
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
