import prisma from "@/lib/prisma";
import { Home, Hammer, Palette, Wrench } from "lucide-react";
import { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Home,
  Hammer,
  Palette,
  Wrench,
};

export interface Service {
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  process?: string[];
  benefits?: string[];
}

export async function getServices(): Promise<Service[]> {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });

  return services.map((s) => ({
    slug: s.slug,
    icon: iconMap[s.icon] || Home,
    title: s.title,
    description: s.description,
    longDescription: s.longDescription,
    features: s.features,
    process: s.process,
    benefits: s.benefits,
  }));
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service) return null;

  return {
    slug: service.slug,
    icon: iconMap[service.icon] || Home,
    title: service.title,
    description: service.description,
    longDescription: service.longDescription,
    features: service.features,
    process: service.process,
    benefits: service.benefits,
  };
}

export async function getAllServiceSlugs(): Promise<string[]> {
  const services = await prisma.service.findMany({
    select: { slug: true },
  });
  return services.map((s) => s.slug);
}
