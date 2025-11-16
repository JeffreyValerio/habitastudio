import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, ShoppingCart } from "lucide-react";
import { getProductById } from "@/lib/data/products";
import { ProductGallery } from "@/components/catalog/product-gallery";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/catalogo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Catálogo
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductGallery image={product.image} gallery={product.gallery} name={product.name} />

          <div className="space-y-6">
            <div>
              <div className="mb-2 text-sm text-muted-foreground">{product.category}</div>
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <div className="mt-4 text-3xl font-bold text-primary">{product.price}</div>
            </div>

            <Separator />

            <div>
              <h2 className="mb-4 text-xl font-semibold">Descripción</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold">Características</h2>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {product.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Especificaciones Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {product.specifications.material && (
                    <div>
                      <span className="font-medium">Material: </span>
                      <span className="text-muted-foreground">{product.specifications.material}</span>
                    </div>
                  )}
                  {product.specifications.dimensions && (
                    <div>
                      <span className="font-medium">Dimensiones: </span>
                      <span className="text-muted-foreground">{product.specifications.dimensions}</span>
                    </div>
                  )}
                  {product.specifications.color && (
                    <div>
                      <span className="font-medium">Colores disponibles: </span>
                      <span className="text-muted-foreground">{product.specifications.color}</span>
                    </div>
                  )}
                  {product.specifications.warranty && (
                    <div>
                      <span className="font-medium">Garantía: </span>
                      <span className="text-muted-foreground">{product.specifications.warranty}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/contacto">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Solicitar Cotización
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

