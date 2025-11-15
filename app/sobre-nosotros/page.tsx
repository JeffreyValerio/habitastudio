import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Users, Calendar, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description: "Conoce la historia de Habita Studio, nuestro equipo y nuestra misión de transformar espacios con muebles de calidad y remodelaciones profesionales.",
};

const values = [
  {
    icon: Award,
    title: "Calidad",
    description: "Trabajamos solo con materiales de primera calidad y proveedores certificados.",
  },
  {
    icon: Users,
    title: "Equipo Experto",
    description: "Nuestro equipo está formado por profesionales con años de experiencia.",
  },
  {
    icon: Calendar,
    title: "Puntualidad",
    description: "Cumplimos con los plazos acordados sin comprometer la calidad del trabajo.",
  },
  {
    icon: Target,
    title: "Satisfacción",
    description: "La satisfacción del cliente es nuestra máxima prioridad en cada proyecto.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sobre Nosotros
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Transformando espacios desde 2010
          </p>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-4xl">
            <div className="prose prose-lg mx-auto">
              <h2 className="text-3xl font-semibold">Nuestra Historia</h2>
              <p className="mt-4 text-muted-foreground">
                Habita Studio nació con la visión de crear espacios que combinen funcionalidad,
                elegancia y calidad. Desde nuestros inicios, nos hemos especializado en el diseño
                de interiores, fabricación de muebles personalizados y remodelaciones completas.
              </p>
              <p className="mt-4 text-muted-foreground">
                Con más de una década de experiencia, hemos completado cientos de proyectos
                exitosos, desde pequeños apartamentos hasta grandes espacios comerciales. Nuestro
                compromiso es ofrecer soluciones que superen las expectativas de nuestros clientes.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-semibold">Nuestros Valores</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-4xl rounded-lg border bg-muted/50 p-12">
            <h2 className="text-center text-3xl font-semibold">Nuestra Misión</h2>
            <p className="mt-6 text-center text-lg text-muted-foreground">
              Transformar espacios habitables en lugares que inspiren, donde cada detalle refleje
              la personalidad y necesidades de quienes los habitan. Ofrecemos soluciones integrales
              que combinan diseño, funcionalidad y calidad, siempre con un servicio excepcional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

