"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, X, ArrowRight } from "lucide-react";
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
              <Card
                key={product.id}
                className="group overflow-hidden border-transparent bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <Link href={`/catalogo/${product.slug}`}>
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-muted/40 to-muted/80">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg hover:text-primary">{product.name}</CardTitle>
                    </CardHeader>
                  </Link>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{product.price}</span>
                      <Button variant="ghost" size="sm" className="group/link -mr-2" asChild>
                        <Link href={`/catalogo/${product.slug}`}>
                          Ver Detalles
                          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                        </Link>
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

