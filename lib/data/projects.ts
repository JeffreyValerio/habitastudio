import prisma from "@/lib/prisma";

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  category: string;
  year: string;
  location?: string;
  duration?: string;
  challenges?: string[];
  solutions?: string[];
  gallery?: string[];
}

export async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    orderBy: [
      { year: "desc" },
      { createdAt: "desc" },
    ],
  });

  return projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription,
    image: p.image,
    category: p.category,
    year: p.year,
    location: p.location || undefined,
    duration: p.duration || undefined,
    challenges: p.challenges,
    solutions: p.solutions,
    gallery: p.gallery,
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) return null;

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    longDescription: project.longDescription,
    image: project.image,
    category: project.category,
    year: project.year,
    location: project.location || undefined,
    duration: project.duration || undefined,
    challenges: project.challenges,
    solutions: project.solutions,
    gallery: project.gallery,
  };
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) return null;

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    longDescription: project.longDescription,
    image: project.image,
    category: project.category,
    year: project.year,
    location: project.location || undefined,
    duration: project.duration || undefined,
    challenges: project.challenges,
    solutions: project.solutions,
    gallery: project.gallery,
  };
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const projects = await prisma.project.findMany({
    select: { slug: true },
  });
  return projects.map((p) => p.slug);
}
