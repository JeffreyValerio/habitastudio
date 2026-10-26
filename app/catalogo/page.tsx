import { Suspense } from "react";
import Link from "next/link";
import { CatalogContent } from "@/components/catalog/catalog-content";
import { Container } from "@/components/site/container";
import { SiteButtonLink } from "@/components/site/site-button";
import { getProducts } from "@/lib/data/products";
import { SITE_CONFIG } from "@/lib/site-config";

const CRUMB =
  "underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <Container className="pb-14 pt-6 md:pb-[104px] md:pt-12">
      <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
        <Link href="/" className={CRUMB}>
          Inicio
        </Link>{" "}
        / <span aria-current="page">Catálogo</span>
      </nav>
      <h1 className="mt-4 font-display text-[40px] font-medium leading-[1.05] text-hs-text md:text-[60px]">
        Catálogo
      </h1>
      <p className="mt-3 max-w-[560px] text-base md:mt-4 text-hs-muted md:text-lg">
        <span className="md:hidden">Muebles a medida para salas, comedores y dormitorios.</span>
        <span className="hidden md:inline">
          Muebles fabricados a medida para salas, comedores y dormitorios. Todos los modelos
          se pueden ajustar a tus medidas y acabados.
        </span>
      </p>

      <Suspense fallback={<div className="mt-8 h-[300px] bg-hs-placeholder" />}>
        <CatalogContent initialProducts={products} />
      </Suspense>

      <section className="mt-14 flex flex-wrap items-center justify-between gap-6 border border-hs-border bg-white p-6 md:mt-[88px] md:px-10 md:py-9">
        <div className="flex max-w-[520px] flex-col gap-2">
          <h2 className="font-display text-[28px] font-medium leading-[1.15] text-hs-text md:text-[32px]">
            ¿No encuentras el mueble que buscas?
          </h2>
          <p className="text-hs-muted">
            Diseñamos y fabricamos muebles a medida que se adaptan perfectamente a tus
            espacios.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SiteButtonLink href="/contacto" data-track-quote data-track-location="catalog_box">
            Solicitar cotización
          </SiteButtonLink>
          <SiteButtonLink
            href={SITE_CONFIG.whatsappUrl}
            data-track-location="catalog_box"
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            WhatsApp
          </SiteButtonLink>
        </div>
      </section>
    </Container>
  );
}
