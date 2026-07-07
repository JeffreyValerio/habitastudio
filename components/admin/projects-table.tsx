"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
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
import { deleteProject } from "@/app/actions/projects";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Edit } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { MobileListItem, ImageAvatar } from "@/components/admin/mobile-list-item";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { SearchInput } from "@/components/admin/search-input";

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
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const confirmDelete = async (id: string) => {
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

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar proyecto?",
      description: "Esta acción eliminará también todas las imágenes asociadas.",
      variant: "destructive",
      action: (
        <ToastAction altText="Confirmar eliminación" onClick={() => confirmDelete(id)}>
          Eliminar
        </ToastAction>
      ),
    });
  };

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const categories = Array.from(counts.keys()).sort();
    return [
      { key: "all", label: "Todos", count: projects.length },
      ...categories.map((c) => ({ key: c, label: c, count: counts.get(c)! })),
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (activeCategory !== "all") {
      filtered = filtered.filter((project) => project.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.slug.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          project.year.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, searchQuery, activeCategory]);

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

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
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
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar por título, categoría, año..."
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredProjects.length} resultado{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <FilterTabs tabs={categoryTabs} active={activeCategory} onChange={handleCategoryChange} />

      {/* Mobile: lista compacta */}
      <div className="md:hidden border rounded-lg">
        {paginatedProjects.map((project) => (
          <MobileListItem
            key={project.id}
            avatar={<ImageAvatar src={project.image} alt={project.title} />}
            title={project.title}
            subtitle={`${project.category} · ${project.year}`}
            actions={
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/projects/${project.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(project.id)}
                  disabled={deleting === project.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            }
          />
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block border rounded-lg">
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

