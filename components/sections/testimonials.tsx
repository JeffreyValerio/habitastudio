import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "María González",
    role: "Propietaria de Casa",
    content: "Habita Studio transformó completamente nuestra cocina. El proceso fue profesional y el resultado superó nuestras expectativas. Altamente recomendado.",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "Director de Empresa",
    content: "Contratamos sus servicios para remodelar nuestras oficinas. El diseño fue moderno y funcional, y el equipo muy profesional. Excelente trabajo.",
    rating: 5,
  },
  {
    id: 3,
    name: "Ana Martínez",
    role: "Arquitecta",
    content: "He trabajado con Habita Studio en varios proyectos. Su atención al detalle y calidad de materiales es excepcional. Son mi primera opción.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="bg-muted/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            La satisfacción de nuestros clientes es nuestra prioridad
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-2">
              <CardContent className="p-6">
                <div className="mb-4 flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

