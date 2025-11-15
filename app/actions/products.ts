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
  price: z.string().min(1),
  description: z.string().min(1),
  features: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  warranty: z.string().optional(),
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

  const { id, ...rest } = product;

  try {
    const prismaTx = await prisma.$transaction(async (tx) => {
      const featuresArray = rest.features
        ? rest.features.split("\n").filter((f) => f.trim())
        : [];

      let dbProduct;

      // Manejo de imágenes
      const imageFile = formData.get("image") as File;
      let imageUrl = formData.get("imageUrl") as string | null;

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
          select: { image: true },
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
            ...rest,
            slug,
            image: imageUrl || existing?.image || "",
            features: featuresArray,
          },
        });
      } else {
        // CREAR
        if (!imageUrl) {
          throw new Error("La imagen es requerida");
        }

        dbProduct = await tx.product.create({
          data: {
            ...rest,
            slug,
            image: imageUrl,
            features: featuresArray,
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
    select: { image: true },
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

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return await prisma.product.findUnique({
    where: { id },
  });
}

