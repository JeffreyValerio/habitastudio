"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Product } from "@/lib/data/products";

const categories = [
  { name: "Todos", slug: "todos" },
  { name: "Salas", slug: "salas" },
  { name: "Comedores", slug: "comedores" },
  { name: "Dormitorios", slug: "dormitorios" },
  { name: "Oficinas", slug: "oficinas" },
  { name: "Cocinas", slug: "cocinas" },
];

export function CatalogContent({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("categoria") || "todos";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);

  useEffect(() => {
    const cat = searchParams.get("categoria") || "todos";
    setSelectedCategory(cat);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let filtered = [...initialProducts];

    if (selectedCategory !== "todos") {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, initialProducts]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    if (category === "todos") {
      url.searchParams.delete("categoria");
    } else {
      url.searchParams.set("categoria", category);
    }
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div className="mt-12">
      <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
        {categories.map((category) => (
          <Button
            key={category.slug}
            variant={selectedCategory === category.slug ? "default" : "outline"}
            onClick={() => handleCategoryChange(category.slug)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="mb-8">
        <div className="relative mx-auto max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Mostrando {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
            {searchQuery && ` para "${searchQuery}"`}
            {selectedCategory !== "todos" && ` en ${categories.find(c => c.slug === selectedCategory)?.name}`}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
                <div>
                  <Link href={`/catalogo/${product.slug}`}>
                    <div className="relative h-64 w-full overflow-hidden bg-muted flex items-center justify-center">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={256}
                        height={256}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                        unoptimized
                      />
                    </div>
                    <CardHeader>
                      <div className="text-sm text-muted-foreground">{product.category}</div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </CardHeader>
                  </Link>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{product.price}</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/catalogo/${product.slug}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            No se encontraron productos
            {searchQuery && ` que coincidan con "${searchQuery}"`}
            {selectedCategory !== "todos" && ` en la categoría ${categories.find(c => c.slug === selectedCategory)?.name}`}
          </p>
          {(searchQuery || selectedCategory !== "todos") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("todos");
                handleCategoryChange("todos");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

