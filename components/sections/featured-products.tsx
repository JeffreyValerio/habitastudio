import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { getProducts } from "@/lib/data/products";

async function getFeaturedProducts() {
  const products = await getProducts();
  return products.slice(0, 4);
}

export async function FeaturedProducts() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Productos Destacados
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Muebles de calidad que transforman tus espacios
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden border-transparent bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href={`/catalogo/${product.id}`}>
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
              </Link>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Link href={`/catalogo/${product.id}`} className="hover:text-primary">
                    {product.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{product.price}</span>
                  <Button asChild variant="ghost" size="sm" className="group/link -mr-2">
                    <Link href={`/catalogo/${product.id}`}>
                      Ver Detalles
                      <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link href="/catalogo">
              Ver Catálogo Completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

