import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, Home, Palette, Wrench } from "lucide-react";

const services = [
  {
    icon: Home,
    title: "Diseño de Interiores",
    description: "Creamos espacios únicos que combinan funcionalidad y estética, adaptados a tu estilo de vida.",
  },
  {
    icon: Hammer,
    title: "Remodelaciones",
    description: "Transformamos tu hogar o negocio con remodelaciones completas de alta calidad.",
  },
  {
    icon: Palette,
    title: "Muebles Personalizados",
    description: "Diseñamos y fabricamos muebles a medida que se adaptan perfectamente a tus espacios.",
  },
  {
    icon: Wrench,
    title: "Asesoría Profesional",
    description: "Te acompañamos en cada paso del proceso con nuestro equipo de expertos.",
  },
];

export function Services() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Nuestros Servicios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Soluciones integrales para transformar tus espacios
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.title} className="border-2 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

