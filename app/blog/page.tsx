import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";

export const metadata: Metadata = {
  title: "Blog",
  description: "Pronto compartiremos ideas, consejos y proyectos de Habita Studio.",
  alternates: { canonical: "/blog" },
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <section className="bg-hs-bg">
      <Container className="flex flex-col items-start gap-5 py-20 md:py-[120px]">
        <Eyebrow>Blog</Eyebrow>
        <h1 className="font-display text-[40px] font-medium leading-[1.05] text-hs-text md:text-[60px]">
          Próximamente
        </h1>
        <p className="max-w-[560px] text-base text-hs-muted md:text-[17px]">
          Pronto compartiremos ideas, consejos y proyectos. Mientras tanto, mira
          lo que hemos hecho.
        </p>
        <div className="flex flex-wrap gap-3 pt-3">
          <SiteButtonLink href="/proyectos">Ver proyectos</SiteButtonLink>
          <SiteButtonLink href="/catalogo" variant="secondary">
            Ver catálogo
          </SiteButtonLink>
        </div>
      </Container>
    </section>
  );
}
