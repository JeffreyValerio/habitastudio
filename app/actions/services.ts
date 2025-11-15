"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const serviceSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  longDescription: z.string().min(1),
  features: z.array(z.string()).default([]),
  process: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  icon: z.string().default("Home"),
});

export async function createService(data: z.infer<typeof serviceSchema>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const validated = serviceSchema.parse(data);

  const service = await prisma.service.create({
    data: validated,
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${validated.slug}`);
  revalidatePath("/");
  return service;
}

export async function updateService(id: string, data: Partial<z.infer<typeof serviceSchema>>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const service = await prisma.service.update({
    where: { id },
    data,
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

