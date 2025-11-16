"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cloudinary } from "@/lib/cloudinary";
import { getPublicIdFromUrl } from "@/lib/cloudinary";

const productSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1),
  slug: z.string().min(1),
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

const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      try {
        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");
        const result = await cloudinary.uploader.upload(
          `data:${file.type};base64,${base64Image}`,
          { folder: "habita-studio/products" }
        );
        return result.secure_url;
      } catch (error) {
        console.error("Error al subir imagen:", error);
        return null;
      }
    });

    const uploadedImages = await Promise.all(uploadPromises);
    return uploadedImages.filter((url): url is string => url !== null);
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

export async function createUpdateProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
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
  const slug = product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { id, cost, price, features, gallery, ...rest } = product;
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

      // Manejo de imágenes
      const imageFile = formData.get("image") as File;
      let imageUrl = formData.get("imageUrl") as string | null;
      // La galería llega ya como URLs desde el cliente (next-cloudinary)
      // También aceptamos 'gallery' en formData si no vino por zod
      if (!galleryUrls.length) {
        const galleryForm = formData.get("gallery") as string | null;
        if (galleryForm) {
          try {
            const parsed = JSON.parse(galleryForm);
            if (Array.isArray(parsed)) {
              galleryUrls = parsed.filter((u) => typeof u === "string");
            }
          } catch (_e) {}
        }
      }

      if (imageFile && imageFile.size > 0) {
        const uploaded = await uploadImages([imageFile]);
        if (uploaded.length > 0) {
          imageUrl = uploaded[0];
        }
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

        dbProduct = await tx.product.update({
          where: { id },
          data: {
            name: product.name,
            slug,
            category: product.category,
            cost: costNumber,
            price: priceNumber,
            description: product.description,
            image: imageUrl || existing?.image || "",
            gallery: galleryUrls.length ? galleryUrls : (existing?.gallery ?? []),
            features: featuresArray,
            material: rest.material || null,
            dimensions: rest.dimensions || null,
            color: rest.color || null,
            warranty: rest.warranty || null,
          },
        });
      } else {
        // CREAR
        if (!imageUrl) {
          throw new Error("La imagen es requerida");
        }

        dbProduct = await tx.product.create({
          data: {
            name: product.name,
            slug,
            category: product.category,
            cost: costNumber,
            price: priceNumber,
            description: product.description,
            image: imageUrl,
            gallery: galleryUrls,
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
    revalidatePath(`/catalogo/${prismaTx.id}`);
    revalidatePath("/");

    return {
      ok: true,
      product: prismaTx,
      message: id ? "Producto actualizado" : "Producto creado",
    };
  } catch (error) {
    return {
      ok: false,
      message: "No se pudo guardar/actualizar el producto: " + error,
    };
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
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

