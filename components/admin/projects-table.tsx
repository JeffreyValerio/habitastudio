"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProject } from "@/app/actions/projects";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Search, X as XIcon } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  year: string;
  image: string;
}

const ITEMS_PER_PAGE = 10;

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este proyecto? Esta acción eliminará también todas las imágenes asociadas.")) {
      return;
    }

    setDeleting(id);
    try {
      await deleteProject(id);
      toast({
        title: "Éxito",
        description: "Proyecto eliminado correctamente",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el proyecto",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(query) ||
        project.slug.toLowerCase().includes(query) ||
        project.category.toLowerCase().includes(query) ||
        project.year.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay proyectos aún.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/projects/new">Crear primer proyecto</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, categoría, año..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => handleSearchChange("")}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredProjects.length} resultado{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagen</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Año</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div className="relative h-16 w-16 rounded overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell>{project.category}</TableCell>
              <TableCell>{project.year}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/projects/${project.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting === project.id}
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

