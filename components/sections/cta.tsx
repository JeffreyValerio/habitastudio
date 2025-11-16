import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl rounded-lg border-2 bg-primary/5 p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ¿Listo para Transformar tu Espacio?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Contáctanos hoy y recibe una cotización gratuita para tu proyecto.
            Estamos aquí para hacer realidad tus ideas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/contacto">
                Solicitar Cotización
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <a
                href="tel:+50663644915"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Phone className="h-4 w-4" />
                +506 6364 4915
              </a>
              <a
                href="mailto:info@habitastudio.online"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                info@habitastudio.online
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}