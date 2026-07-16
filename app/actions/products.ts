"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cloudinary } from "@/lib/cloudinary";
import { getPublicIdFromUrl } from "@/lib/cloudinary";
import { getSectionAccess } from "@/app/actions/role-permissions";

const productSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1),
  category: z.string().min(1),
  cost: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
      }
      return typeof val === 'number' ? val : 0;
    },
    z.number().optional()
  ),
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
      }
      return typeof val === 'number' ? val : 0;
    },
    z.number().min(0.01, "El precio debe ser mayor a 0")
  ),
  description: z.string().min(1),
  features: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  warranty: z.string().optional(),
  gallery: z.string().optional(), // JSON string de URLs
});

export async function createUpdateProduct(formData: FormData) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return { ok: false, message: "Unauthorized" };
  }

  const data = Object.fromEntries(formData);
  const parsedData = productSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      ok: false,
      error: "Validation error",
      fieldErrors: parsedData.error,
    };
  }

  const product = parsedData.data;
  const baseSlug = product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { id, cost, price, features, gallery, ...rest } = product;

  // Evitar el choque de unicidad en slug (P2002) cuando dos productos
  // generan el mismo slug a partir del nombre: se le agrega un sufijo
  // numerico hasta encontrar uno libre, en vez de fallar al guardar.
  let slug = baseSlug;
  let suffix = 2;
  while (
    await prisma.product.findFirst({
      where: { slug, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  // Parsear galería si viene como JSON string
  let galleryUrls: string[] = [];
  if (gallery) {
    try {
      const parsed = JSON.parse(gallery);
      if (Array.isArray(parsed)) {
        galleryUrls = parsed.filter((u) => typeof u === "string");
      }
    } catch (_) {
      // ignore parse error
    }
  }
  
  // Los valores ya están convertidos a números por el preprocess
  const priceNumber = price || 0;
  const costNumber = cost || 0;

  try {
    const prismaTx = await prisma.$transaction(async (tx) => {
      const featuresArray = features
        ? features.split("\n").filter((f) => f.trim())
        : [];

      let dbProduct;

      // Las imágenes ya se subieron a Cloudinary desde el cliente (vía
      // /api/upload) antes de llamar a esta acción; aquí solo llegan URLs.
      let imageUrl = formData.get("imageUrl") as string | null;

      const galleryForm = formData.get("gallery") as string | null;
      if (galleryForm) {
        try {
          const parsed = JSON.parse(galleryForm);
          if (Array.isArray(parsed)) {
            galleryUrls = parsed.filter((u) => typeof u === "string");
          }
        } catch (_e) {}
      }

      if (id) {
        // ACTUALIZAR
        const existing = await tx.product.findUnique({
          where: { id },
          select: { image: true, gallery: true },
        });

        // Eliminar imagen antigua si hay una nueva
        if (imageUrl && existing?.image && existing.image !== imageUrl) {
          try {
            const publicId = getPublicIdFromUrl(existing.image);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (error) {
            console.error("Error deleting old image:", error);
          }
        }

        // Eliminar de Cloudinary imágenes removidas de la galería
        const existingGallery = existing?.gallery ?? [];
        const removedFromGallery = existingGallery.filter((url) => !galleryUrls.includes(url));
        for (const url of removedFromGallery) {
          try {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (error) {
            console.error("Error deleting removed gallery image:", error);
          }
        }

        // Definir imagen principal: priorizar nueva 'imageUrl', luego primera de nueva galería, luego existente
        const mainImage =
          imageUrl ||
          (galleryUrls.length ? galleryUrls[0] : undefined) ||
          existing?.image ||
          "";

        // Usar la galería que viene del formulario (ya tiene las eliminaciones aplicadas)
        const finalGallery = [...new Set(galleryUrls)];

        dbProduct = await tx.product.update({
          where: { id },
          data: {
            name: product.name,
            slug,
            category: product.category,
            cost: costNumber,
            price: priceNumber,
            description: product.description,
            image: mainImage,
            gallery: finalGallery,
            features: featuresArray,
            material: rest.material || null,
            dimensions: rest.dimensions || null,
            color: rest.color || null,
            warranty: rest.warranty || null,
          },
        });
      } else {
        // CREAR
        const mainImage =
          imageUrl ||
          (galleryUrls.length ? galleryUrls[0] : undefined) ||
          null;

        if (!mainImage) throw new Error("La imagen es requerida");

        dbProduct = await tx.product.create({
          data: {
            name: product.name,
            slug,
            category: product.category,
            cost: costNumber,
            price: priceNumber,
            description: product.description,
            image: mainImage,
            gallery: galleryUrls.length ? [...new Set(galleryUrls)] : [],
            features: featuresArray,
            material: rest.material || null,
            dimensions: rest.dimensions || null,
            color: rest.color || null,
            warranty: rest.warranty || null,
          },
        });
      }

      return dbProduct;
    });

    revalidatePath("/catalogo");
    revalidatePath(`/catalogo/${prismaTx.slug}`);
    revalidatePath("/");

    const message = id ? "Producto actualizado" : "Producto creado";

    return {
      ok: true,
      product: prismaTx,
      message,
    };
  } catch (error: any) {
    console.error("Error completo en createUpdateProduct:", error);
    const errorMessage = error?.message || String(error);
    return {
      ok: false,
      message: `No se pudo guardar/actualizar el producto: ${errorMessage}`,
    };
  }
}

export async function deleteProduct(id: string) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return { ok: false as const, message: "No autorizado" };
  }

  // Obtener el producto para eliminar su imagen
  const product = await prisma.product.findUnique({
    where: { id },
    select: { image: true, gallery: true },
  });

  if (product?.image) {
    try {
      const publicId = getPublicIdFromUrl(product.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error("Error deleting product image:", error);
    }
  }
  // Eliminar imágenes de la galería
  if (product?.gallery?.length) {
    for (const url of product.gallery) {
      try {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error("Error deleting gallery image:", error);
      }
    }
  }

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/catalogo");
  revalidatePath("/");

  return { ok: true as const };
}

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  // Retornar productos con cost y price como números (para admin)
  return products.map(p => ({
    ...p,
    cost: p.cost ?? 0,
    price: p.price,
  }));
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product) return null;
  return {
    ...product,
    cost: product.cost ?? 0,
    price: product.price,
  };
}

// Obtener productos para selector en cotizaciones (con precio numérico)
export async function getProductsForQuotes() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });
  
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
    category: p.category,
  }));
}

