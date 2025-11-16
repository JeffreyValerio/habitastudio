import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { getProjectBySlug, getAllProjectSlugs } from "@/lib/data/projects";
import { ProductGallery } from "@/components/catalog/product-gallery";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Proyecto no encontrado",
    };
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [
        {
          url: project.image,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [project.image],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/proyectos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Link>
        </Button>

        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                {project.category}
              </span>
              <span className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
                {project.year}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {project.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {project.description}
            </p>
          </div>

          <div className="mb-8">
            <ProductGallery image={project.image} gallery={project.gallery || []} name={project.title} aspect="video" />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold">Sobre el Proyecto</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {project.longDescription}
                </p>
              </div>

              {project.challenges && project.solutions && (
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Desafíos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {project.challenges.map((challenge, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm text-muted-foreground">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Soluciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {project.solutions.map((solution, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* La galería adicional se maneja dentro del componente ProductGallery (miniaturas y lightbox) */}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Proyecto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Ubicación</div>
                        <div className="text-sm text-muted-foreground">{project.location}</div>
                      </div>
                    </div>
                  )}
                  {project.duration && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Duración</div>
                        <div className="text-sm text-muted-foreground">{project.duration}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Año</div>
                      <div className="text-sm text-muted-foreground">{project.year}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/20" />
                    <div>
                      <div className="text-sm font-medium">Categoría</div>
                      <div className="text-sm text-muted-foreground">{project.category}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>¿Te gusta este proyecto?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Contáctanos para discutir cómo podemos crear algo similar para ti.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/contacto">Solicitar Consulta</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

