import prisma from "@/lib/prisma";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: string; // Formateado como string en CRC para mostrar
  image: string;
  gallery?: string[];
  description: string;
  features: string[];
  specifications?: {
    material?: string;
    dimensions?: string;
    color?: string;
    warranty?: string;
  };
}

const formatPriceCRC = (price: number): string => {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: typeof p.price === 'number' ? formatPriceCRC(p.price) : p.price,
    image: p.image,
    gallery: p.gallery ?? [],
    description: p.description,
    features: p.features,
    specifications: {
      material: p.material || undefined,
      dimensions: p.dimensions || undefined,
      color: p.color || undefined,
      warranty: p.warranty || undefined,
    },
  }));
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: typeof product.price === 'number' ? formatPriceCRC(product.price) : product.price,
    image: product.image,
    gallery: product.gallery ?? [],
    description: product.description,
    features: product.features,
    specifications: {
      material: product.material || undefined,
      dimensions: product.dimensions || undefined,
      color: product.color || undefined,
      warranty: product.warranty || undefined,
    },
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: typeof product.price === 'number' ? formatPriceCRC(product.price) : product.price,
    image: product.image,
    gallery: product.gallery ?? [],
    description: product.description,
    features: product.features,
    specifications: {
      material: product.material || undefined,
      dimensions: product.dimensions || undefined,
      color: product.color || undefined,
      warranty: product.warranty || undefined,
    },
  };
}
