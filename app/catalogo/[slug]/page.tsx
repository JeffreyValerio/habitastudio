import { SITE_URL, firstSentence } from "@/lib/site-url";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PRODUCT_SLUG_REDIRECTS } from "@/lib/product-slug-redirects";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";
import { SpecList } from "@/components/site/spec-list";
import { ProcessSteps } from "@/components/site/process-steps";
import { ProductCard } from "@/components/site/product-card";
import { categoryHref, categoryLabel, normalizeCategory } from "@/lib/catalog-categories";
import { SITE_CONFIG } from "@/lib/site-config";
import { TrackProductView } from "@/components/site/track-view";

const CRUMB =
  "underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    const newSlug = PRODUCT_SLUG_REDIRECTS[slug];
    if (newSlug) permanentRedirect("/catalogo/" + newSlug);
    return { title: "Producto no encontrado" };
  }

  const description = firstSentence(product.description) || undefined;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/catalogo/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/catalogo/${product.slug}`,
      images: [
        {
          url: product.image,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    const newSlug = PRODUCT_SLUG_REDIRECTS[slug];
    if (newSlug) permanentRedirect("/catalogo/" + newSlug);
    notFound();
  }

  const related = await getRelatedProducts(product.slug, product.category, 3);

  // Se incluye el link (no solo el texto) para que WhatsApp genere la vista
  // previa con la imagen del producto, usando el Open Graph ya definido en
  // generateMetadata de esta misma página.
  const productUrl = `${SITE_URL}/catalogo/${product.slug}`;
  const whatsappMessage = `Hola, me interesa cotizar este producto:\n\n*${product.name}*\nCategoría: ${product.category}\nPrecio: ${product.price}\n\n${productUrl}\n\n¿Podrían darme más información?`;
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const quoteUrl = `/contacto?asunto=${encodeURIComponent("Cotización")}&producto=${encodeURIComponent(product.name)}`;

  const categoryValue = normalizeCategory(product.category);
  const catLabel = categoryLabel(product.category);
  const hasPrice =
    !!product.price && product.price.trim() !== "" && !/^\D*0+\D*$/.test(product.price);
  const specs = product.specifications;

  return (
    <div className="pb-24 md:pb-0">
      <TrackProductView
        slug={product.slug}
        name={product.name}
        category={categoryLabel(normalizeCategory(product.category))}
      />
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          /{" "}
          <Link href="/catalogo" className={CRUMB}>
            Catálogo
          </Link>{" "}
          /{" "}
          <Link href={categoryHref(categoryValue)} className={CRUMB}>
            {catLabel}
          </Link>{" "}
          / <span aria-current="page">{product.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap gap-8 md:mt-8 md:gap-14">
          <div className="min-w-0 flex-[1.3_1_520px]">
            <ProductGallery
              image={product.image}
              gallery={product.gallery}
              video={product.video}
              name={product.name}
            />
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Eyebrow>{catLabel}</Eyebrow>
              <h1 className="font-display text-[38px] font-medium leading-[1.05] text-hs-text md:text-[52px]">
                {product.name}
              </h1>
              {hasPrice && (
                <div className="flex flex-col gap-1">
                  <span className="text-[28px] font-semibold text-hs-accent">
                    Desde {product.price}
                  </span>
                  <span className="text-sm text-hs-muted">
                    Precios de referencia. Confirma el precio final en tu cotización.
                  </span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="whitespace-pre-line text-base leading-[1.6] text-hs-text2">
                {product.description}
              </p>
            )}

            {product.features.length > 0 && (
              <ul className="flex flex-col gap-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] text-hs-text2">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-hs-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <SpecList
              rows={[
                { label: "Medidas", value: specs?.dimensions },
                { label: "Material", value: specs?.material },
                { label: "Acabados", value: specs?.color },
                { label: "Garantía", value: specs?.warranty },
              ]}
            />

            <div className="flex flex-wrap gap-3">
              <SiteButtonLink
                href={quoteUrl}
                data-track-quote
                data-track-location="product_page"
                data-track-product={product.name}
                className="max-sm:w-full"
              >
                Solicitar cotización de este modelo
              </SiteButtonLink>
              <SiteButtonLink
                href={whatsappUrl}
                data-track-location="product_page"
                data-track-product={product.name}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="max-sm:w-full"
              >
                Consultar por WhatsApp
              </SiteButtonLink>
            </div>

            <p className="text-sm text-hs-muted">
              ¿Necesitas otras medidas? Ajustamos el diseño a tu espacio sin costo de cotización.
            </p>
          </div>
        </div>
      </Container>

      <Container className="mt-14 md:mt-[88px]">
        <div className="border-t border-hs-rule pt-10 md:pt-14">
          <h2 className="mb-6 font-display text-[28px] font-medium leading-[1.15] text-hs-text md:text-[32px]">
            Cómo trabajamos
          </h2>
          <ProcessSteps compact />
        </div>
      </Container>

      {related.length > 0 && (
        <Container as="section" className="mt-14 pb-14 md:mt-[88px] md:pb-[104px]">
          <h2 className="mb-8 font-display text-[28px] font-medium leading-[1.15] text-hs-text md:text-[40px]">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                category={categoryLabel(p.category)}
                image={p.image}
                dimensions={p.specifications?.dimensions}
                material={p.specifications?.material}
                price={p.price}
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
