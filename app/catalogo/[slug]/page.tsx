import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, CheckCircle2, Ruler, Palette, ShieldCheck, Layers } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Icons } from "@/components/icons";

const WHATSAPP_NUMBER = "50663644915";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const whatsappMessage = `Hola, me interesa cotizar este producto:\n\n*${product.name}*\nCategoría: ${product.category}\nPrecio: ${product.price}\n\n¿Podrían darme más información?`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const specs = product.specifications;
  const specItems = [
    { key: "material", label: "Material", value: specs?.material, icon: Layers },
    { key: "dimensions", label: "Dimensiones", value: specs?.dimensions, icon: Ruler },
    { key: "color", label: "Colores", value: specs?.color, icon: Palette },
    { key: "warranty", label: "Garantía", value: specs?.warranty, icon: ShieldCheck },
  ].filter((s) => s.value);

  return (
    <div className="py-8 md:py-12 pb-28 md:pb-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link href="/catalogo" className="hover:text-primary transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/catalogo?categoria=${encodeURIComponent(product.category)}`}
            className="hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-2">
          <ProductGallery image={product.image} gallery={product.gallery} name={product.name} />

          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-balance">{product.name}</h1>
              <div className="mt-4 text-3xl font-bold text-primary">{product.price}</div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white"
                asChild
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Icons.whatsapp className="h-5 w-5" />
                  Cotizar por WhatsApp
                </a>
              </Button>
            </div>

            <Separator />

            <div>
              <h2 className="mb-3 text-xl font-semibold">Descripción</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {product.features.length > 0 && (
              <div>
                <h2 className="mb-3 text-xl font-semibold">Características</h2>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specItems.length > 0 && (
              <div>
                <h2 className="mb-3 text-xl font-semibold">Especificaciones</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specItems.map(({ key, label, value, icon: Icon }) => (
                    <div
                      key={key}
                      className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur p-4 md:hidden">
        <Button
          size="lg"
          className="w-full gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white"
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Icons.whatsapp className="h-5 w-5" />
            Cotizar por WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}


