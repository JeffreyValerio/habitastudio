"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  features: z.array(z.string()).default([]),
  process: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  icon: z.string().default("Home"),
  image: z.string().url().optional(),
});

export async function createService(data: z.infer<typeof serviceSchema>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const validated = serviceSchema.parse(data);

  const computedSlug =
    validated.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const service = await prisma.service.create({
    data: { ...validated, slug: computedSlug },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${service.slug}`);
  revalidatePath("/");
  return service;
}

export async function updateService(id: string, data: Partial<z.infer<typeof serviceSchema>>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Servicio no encontrado");
  }

  const computedSlug =
    (data.title
      ? data.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : existing.slug) || existing.slug;

  const service = await prisma.service.update({
    where: { id },
    data: { ...data, slug: computedSlug },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${service.slug}`);
  revalidatePath("/");
  return service;
}

export async function deleteService(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/servicios");
  revalidatePath("/");
}

export async function getServices() {
  return await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getService(id: string) {
  return await prisma.service.findUnique({
    where: { id },
  });
}

