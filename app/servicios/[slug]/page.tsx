import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { getServiceBySlug, getAllServiceSlugs } from "@/lib/data/services";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Servicio no encontrado",
    };
  }

  return {
    title: service.title,
    description: service.description,
    openGraph: {
      title: service.title,
      description: service.description,
      images: service.image ? [service.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: service.title,
      description: service.description,
      images: service.image ? [service.image] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const Icon = service.icon;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/servicios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Servicios
          </Link>
        </Button>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {service.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {service.description}
            </p>
          </div>

          {service.image && (
            <div className="mb-10 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={service.image}
                alt={service.title}
                className="max-h-[480px] w-full max-w-4xl rounded-lg border bg-muted object-contain"
              />
            </div>
          )}

          <Separator className="my-8" />

          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Sobre este Servicio</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {service.longDescription}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Características Principales</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {service.process && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nuestro Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {service.process.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-muted-foreground">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {service.benefits && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Beneficios</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {service.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="mt-12 rounded-lg border-2 bg-primary/5 p-8 text-center">
            <h3 className="mb-4 text-2xl font-semibold">¿Listo para comenzar?</h3>
            <p className="mb-6 text-muted-foreground">
              Contáctanos hoy y recibe una consulta gratuita para tu proyecto.
            </p>
            <Button size="lg" asChild>
              <Link href="/contacto">
                Solicitar Consulta Gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

