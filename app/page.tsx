import { Hero } from "@/components/sections/hero";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { Services } from "@/components/sections/services";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { Testimonials } from "@/components/sections/testimonials";
import { CTA } from "@/components/sections/cta";

export const metadata = {
  title: "Inicio",
  description: "Habita Studio - Transformamos espacios con muebles de calidad y remodelaciones profesionales. Diseño elegante y funcional para tu hogar o negocio.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <FeaturedProjects />
      <FeaturedProducts />
      <Testimonials />
      <CTA />
    </>
  );
}

