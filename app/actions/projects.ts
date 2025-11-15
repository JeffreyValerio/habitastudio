"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPublicIdFromUrl,
  deleteImage,
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
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  return await prisma.project.findUnique({
    where: { id },
  });
}

