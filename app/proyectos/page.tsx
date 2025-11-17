import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Proyectos Realizados",
  description: "Galería de proyectos completados por Habita Studio. Remodelaciones, diseño de interiores y espacios transformados con calidad y elegancia.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Proyectos Realizados
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Descubre algunos de nuestros trabajos más destacados
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-64 w-full overflow-hidden bg-muted flex items-center justify-center">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={512}
                  height={288}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground">
                    {project.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
                    {project.year}
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/proyectos/${project.slug}`}>Ver Proyecto Completo</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

