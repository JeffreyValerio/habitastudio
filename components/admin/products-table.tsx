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
import { deleteProduct } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Search, X as XIcon } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  image: string;
}

const ITEMS_PER_PAGE = 10;

const formatPriceCRC = (price: number): string => {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export function ProductsTable({ products }: { products: Product[] }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto? Esta acción eliminará también la imagen asociada.")) {
      return;
    }

    setDeleting(id);
    try {
      await deleteProduct(id);
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        formatPriceCRC(product.price).toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, categoría..."
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
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="border rounded-lg">
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
              <TableCell>{formatPriceCRC(product.price)}</TableCell>
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

