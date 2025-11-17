import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getServices } from "@/lib/data/services";

export const metadata: Metadata = {
  title: "Nuestros Servicios",
  description: "Habita Studio ofrece servicios completos de diseño de interiores, remodelaciones, muebles personalizados y asesoría profesional. Soluciones integrales para transformar tus espacios.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Nuestros Servicios
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Soluciones integrales para transformar tus espacios
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.title} className="border-2">
                {service.image && (
                  <div className="relative w-full aspect-video overflow-hidden rounded-t-lg border-b bg-muted flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.image} alt={service.title} className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="mt-6 w-full">
                    <Link href={`/servicios/${service.slug}`}>Ver Detalles</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

