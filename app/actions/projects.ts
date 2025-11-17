"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPublicIdFromUrl,
  deleteImage,
  uploadImages as uploadMany,
} from "@/lib/cloudinary";

const projectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  image: z.string().url(),
  category: z.string().min(1),
  year: z.string().min(1),
  location: z.string().optional(),
  duration: z.string().optional(),
  challenges: z.array(z.string()).default([]),
  solutions: z.array(z.string()).default([]),
  gallery: z.array(z.string()).default([]),
});

export async function createProject(data: z.infer<typeof projectSchema>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const validated = projectSchema.parse(data);

  const project = await prisma.project.create({
    data: validated,
  });

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${validated.slug}`);
  revalidatePath("/");
  return project;
}

export async function updateProject(
  id: string,
  data: Partial<z.infer<typeof projectSchema>>,
  oldData?: { image?: string; gallery?: string[] }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Eliminar imagen principal antigua si cambió
  if (data.image && oldData?.image && data.image !== oldData.image) {
    try {
      const publicId = getPublicIdFromUrl(oldData.image);
      if (publicId) {
        await deleteImage(publicId);
      }
    } catch (error) {
      console.error("Error deleting old project image:", error);
    }
  }

  // Eliminar imágenes de galería que ya no están
  if (oldData?.gallery && data.gallery) {
    const imagesToDelete = oldData.gallery.filter(
      (url) => !data.gallery!.includes(url)
    );
    for (const url of imagesToDelete) {
      try {
        const publicId = getPublicIdFromUrl(url);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (error) {
        console.error("Error deleting gallery image:", error);
      }
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data,
  });

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${project.slug}`);
  revalidatePath("/");
  return project;
}

export async function deleteProject(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Obtener el proyecto para eliminar sus imágenes
  const project = await prisma.project.findUnique({
    where: { id },
    select: { image: true, gallery: true },
  });

  if (project) {
    // Eliminar imagen principal
    if (project.image) {
      try {
        const publicId = getPublicIdFromUrl(project.image);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (error) {
        console.error("Error deleting project image:", error);
      }
    }

    // Eliminar imágenes de galería
    if (project.gallery && project.gallery.length > 0) {
      for (const url of project.gallery) {
        try {
          const publicId = getPublicIdFromUrl(url);
          if (publicId) {
            await deleteImage(publicId);
          }
        } catch (error) {
          console.error("Error deleting gallery image:", error);
        }
      }
    }
  }

  await prisma.project.delete({
    where: { id },
  });

  revalidatePath("/proyectos");
  revalidatePath("/");
}

export async function getProjects() {
  return await prisma.project.findMany({
    orderBy: [
      { year: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
  });
}

// Estilo Arktee: crear/actualizar proyecto con FormData (manejo de múltiples imágenes)
export async function createUpdateProject(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Unauthorized" };
  }

  // Campos básicos
  const id = formData.get("id") as string | null;
  const title = (formData.get("title") as string) || "";
  const description = (formData.get("description") as string) || "";
  const longDescription = (formData.get("longDescription") as string) || "";
  const imageUrlExisting = (formData.get("imageUrl") as string) || "";
  const imageFile = formData.get("image") as File | null;
  const category = (formData.get("category") as string) || "";
  const year = (formData.get("year") as string) || "";
  const location = (formData.get("location") as string) || null;
  const duration = (formData.get("duration") as string) || null;

  const challengesStr = (formData.get("challenges") as string) || "";
  const solutionsStr = (formData.get("solutions") as string) || "";
  const challenges = challengesStr ? challengesStr.split("\n").filter((c) => c.trim()) : [];
  const solutions = solutionsStr ? solutionsStr.split("\n").filter((s) => s.trim()) : [];

  // Galería existente (URLs) y nuevas entradas
  // Priorizar el JSON del formulario que ya tiene las eliminaciones aplicadas
  let galleryUrls: string[] = [];
  const galleryJson = formData.get("gallery") as string | null;
  if (galleryJson) {
    try {
      const parsed = JSON.parse(galleryJson);
      if (Array.isArray(parsed)) galleryUrls = parsed.filter((u) => typeof u === "string");
    } catch {}
  }
  
  // Si no hay JSON, usar imageUrls como fallback (compatibilidad)
  if (galleryUrls.length === 0) {
    const directUrls = formData.getAll("imageUrls") as string[];
    if (directUrls?.length) galleryUrls.push(...directUrls);
  }

  // Agregar archivos nuevos subidos
  const files = formData.getAll("images") as File[];
  if (files?.length) {
    const uploaded = await uploadMany(files, "habita-studio/projects");
    galleryUrls.push(...uploaded);
  }

  // Unificados y sin duplicados
  galleryUrls = [...new Set(galleryUrls)];

  try {
    const project = await prisma.$transaction(async (tx) => {
      // Subir imagen principal si vino archivo
      let uploadedMain: string | null = null;
      if (imageFile && typeof imageFile !== "string" && (imageFile as any).size > 0) {
        const uploaded = await uploadMany([imageFile], "habita-studio/projects");
        uploadedMain = uploaded[0] || null;
      }

      if (id) {
        const existing = await tx.project.findUnique({ where: { id } });
        if (!existing) throw new Error("Proyecto no encontrado");

        // Definir imagen principal: priorizar archivo nuevo, luego imageUrl existente, luego existente o primera de galería
        let mainImage = uploadedMain || imageUrlExisting || existing.image;
        if (uploadedMain && existing.image && uploadedMain !== existing.image) {
          try {
            const publicId = getPublicIdFromUrl(existing.image);
            if (publicId) await deleteImage(publicId);
          } catch {}
        }
        // Si no hay principal definida y hay nuevas en galería, usar la primera
        if (!mainImage && galleryUrls.length) mainImage = galleryUrls[0];

        // Eliminar de Cloudinary imágenes removidas de la galería
        const removed = (existing.gallery ?? []).filter((url) => !galleryUrls.includes(url));
        for (const url of removed) {
          try {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) await deleteImage(publicId);
          } catch {}
        }

        const computedSlug =
          title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || existing.slug;

        const updated = await tx.project.update({
          where: { id },
          data: {
            slug: computedSlug,
            title,
            description,
            longDescription,
            image: mainImage,
            category,
            year,
            location,
            duration,
            challenges,
            solutions,
            gallery: galleryUrls,
          },
        });
        return updated;
      } else {
        // Crear
        const mainImage = uploadedMain || imageUrlExisting || (galleryUrls.length ? galleryUrls[0] : "");
        if (!mainImage) throw new Error("La imagen principal es requerida");

        const computedSlug =
          title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || crypto.randomUUID();

        const created = await tx.project.create({
          data: {
            slug: computedSlug,
            title,
            description,
            longDescription,
            image: mainImage,
            category,
            year,
            location,
            duration,
            challenges,
            solutions,
            gallery: galleryUrls,
          },
        });
        return created;
      }
    });

    revalidatePath("/proyectos");
    revalidatePath(`/proyectos/${project.slug}`);
    revalidatePath("/");

    return { ok: true, project, message: id ? "Proyecto actualizado" : "Proyecto creado" };
  } catch (error) {
    return { ok: false, message: "No se pudo guardar/actualizar el proyecto: " + error };
  }
}

