"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCRC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Trash2, Edit } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { MobileListItem, ImageAvatar } from "@/components/admin/mobile-list-item";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { SearchInput } from "@/components/admin/search-input";

interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  image: string;
}

const ITEMS_PER_PAGE = 10;


export function ProductsTable({ products }: { products: Product[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      const result = await deleteProduct(id);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "¿Eliminar producto?",
      description: "Esta acción eliminará también la imagen asociada.",
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
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    const categories = Array.from(counts.keys()).sort();
    return [
      { key: "all", label: "Todos", count: products.length },
      ...categories.map((c) => ({ key: c, label: c, count: counts.get(c)! })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (activeCategory !== "all") {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          formatCRC(product.price, 0).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchQuery, activeCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    setCurrentPage(1);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay productos aún.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/products/new">Crear primer producto</Link>
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
          placeholder="Buscar por nombre, categoría..."
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <FilterTabs tabs={categoryTabs} active={activeCategory} onChange={handleCategoryChange} />

      {/* Mobile: lista compacta */}
      <div className="md:hidden border rounded-lg">
        {paginatedProducts.map((product) => (
          <MobileListItem
            key={product.id}
            avatar={<ImageAvatar src={product.image} alt={product.name} />}
            title={product.name}
            subtitle={product.category}
            value={formatCRC(product.price, 0)}
            actions={
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link href={`/admin/products/${product.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(product.id)}
                  disabled={deleting === product.id}
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
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative h-16 w-16 rounded overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{formatCRC(product.price, 0)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/products/${product.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
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

