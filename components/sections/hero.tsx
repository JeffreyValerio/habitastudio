import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex h-[calc(100vh-4rem)] min-h-[600px] items-center overflow-hidden">
      <Image
        src="https://res.cloudinary.com/jeffreyvalerio/image/upload/f_auto,q_auto,w_2000/habita-studio/products/gallery/th2936hwxjoaz691l6fw.jpg"
        alt="Walk-in closet a medida diseñado y fabricado por Habita Studio"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1f36]/95 via-[#0c1f36]/80 to-[#0c1f36]/55" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Transformamos Espacios con{" "}
            <span className="text-[hsl(211,70%,68%)]">Diseño y Calidad</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl">
            Habita Studio ofrece muebles de calidad y servicios de remodelación profesional.
            Creamos espacios elegantes y funcionales que reflejan tu estilo de vida.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="group bg-white text-[#0c1f36] hover:bg-white/90">
              <Link href="/catalogo">
                Ver Catálogo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/proyectos">Ver Proyectos</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
