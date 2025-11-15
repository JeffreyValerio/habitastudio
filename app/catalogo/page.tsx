import { Suspense } from "react";
import { CatalogContent } from "@/components/catalog/catalog-content";
import { getProducts } from "@/lib/data/products";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Catálogo de Productos
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Descubre nuestra amplia selección de muebles de calidad
          </p>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <CatalogContent initialProducts={products} />
        </Suspense>
      </div>
    </div>
  );
}
