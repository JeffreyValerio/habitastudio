import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SectionHeader } from "@/components/site/section-header";
import { SiteButtonLink } from "@/components/site/site-button";
import { ProductCard } from "@/components/site/product-card";
import { CategoryTile } from "@/components/site/category-tile";
import { SpecList } from "@/components/site/spec-list";
import { ProcessSteps } from "@/components/site/process-steps";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { CTABand } from "@/components/site/cta-band";
import { ImagePlaceholder } from "@/components/site/image-placeholder";
import { getProducts } from "@/lib/data/products";
import { buildCategories, categoryHref, normalizeCategory } from "@/lib/catalog-categories";
import { getProjects, pickFeaturedProject } from "@/lib/data/projects";

export const metadata = {
  title: { absolute: "Habita Studio | Muebles a medida y remodelación en Costa Rica" },
  description: "Muebles a medida y remodelaciones en Costa Rica. Diseñamos, fabricamos e instalamos cocinas, closets y espacios completos con acabados de calidad.",
  alternates: { canonical: "/" },
};

const HERO_IMAGE =
  "https://res.cloudinary.com/jeffreyvalerio/image/upload/f_auto,q_auto,w_1600/habita-studio/products/gallery/th2936hwxjoaz691l6fw.jpg";

const SECTION = "pt-14 md:pt-[104px]";
const LINK =
  "inline-flex min-h-[44px] items-center text-[15px] font-medium text-hs-accent underline underline-offset-4 hover:text-hs-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

const TRUST = [
  { title: "Desde 2010", text: "Más de una década diseñando, fabricando y remodelando." },
  { title: "Cientos de proyectos", text: "De apartamentos pequeños a grandes espacios comerciales." },
  { title: "Hecho a medida", text: "Cada pieza se adapta a tu espacio y necesidad." },
  { title: "Materiales de primera", text: "Trabajamos con proveedores certificados." },
];

const SERVICES = [
  { title: "Diseño de interiores", text: "Creamos espacios únicos que combinan funcionalidad y estética, adaptados a tu estilo de vida." },
  { title: "Remodelaciones", text: "Transformamos tu hogar o negocio con remodelaciones completas de alta calidad." },
  { title: "Muebles personalizados", text: "Diseñamos y fabricamos muebles a medida que se adaptan perfectamente a tus espacios." },
  { title: "Asesoría profesional", text: "Te acompañamos en cada paso del proceso con nuestro equipo de expertos." },
];

const TESTIMONIALS = [
  { name: "María González", role: "Propietaria de casa", quote: "Habita Studio transformó completamente nuestra cocina. El proceso fue profesional y el resultado superó nuestras expectativas. Altamente recomendado." },
  { name: "Carlos Rodríguez", role: "Director de empresa", quote: "Contratamos sus servicios para remodelar nuestras oficinas. El diseño fue moderno y funcional, y el equipo muy profesional. Excelente trabajo." },
  { name: "Ana Martínez", role: "Arquitecta", quote: "He trabajado con Habita Studio en varios proyectos. Su atención al detalle y calidad de materiales es excepcional. Son mi primera opción." },
];

export default async function Home() {
  const [products, projects] = await Promise.all([getProducts(), getProjects()]);
  const featuredProducts = products.slice(0, 4);
  const imageFor = (cat: string) =>
    products.find((p) => normalizeCategory(p.category) === cat && p.image)?.image ?? null;

  const featuredProject = pickFeaturedProject(projects);

  const productCategories = buildCategories(products.map((p) => p.category)).map((c, i) => ({
    name: c.label,
    href: categoryHref(c.value),
    image: imageFor(c.value),
    tone: (i % 2 === 1 ? "alt" : "default") as "default" | "alt",
  }));
  const categories = [
    ...productCategories,
    { name: "Closets y organización", href: "/servicios", image: null, tone: (productCategories.length % 2 === 1 ? "alt" : "default") as "default" | "alt" },
  ];
  const gridCols =
    categories.length >= 4
      ? "md:grid-cols-4"
      : categories.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2";

  return (
    <>
      {/* 1. Hero */}
      <Container
        as="section"
        className="flex flex-wrap items-center gap-8 pb-14 pt-8 md:gap-14 md:pb-[88px] md:pt-[72px]"
      >
        <div className="flex flex-[1_1_420px] flex-col gap-[18px] md:gap-6">
          <Eyebrow>Muebles a medida · San José, Costa Rica</Eyebrow>
          <h1 className="font-display text-[42px] font-medium leading-[1.05] tracking-[-0.01em] text-hs-text md:text-[68px] md:leading-[1.02]">
            Transformamos espacios con diseño y calidad
          </h1>
          <p className="max-w-[500px] text-base text-hs-muted md:text-lg">
            Habita Studio ofrece muebles de calidad y servicios de remodelación profesional.
            Creamos espacios elegantes y funcionales que reflejan tu estilo de vida.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <SiteButtonLink href="/catalogo">Ver catálogo</SiteButtonLink>
            <SiteButtonLink href="/proyectos" variant="secondary">
              Ver proyectos
            </SiteButtonLink>
          </div>
          <span className="text-sm text-hs-muted">
            Cotización gratuita · Lunes a viernes, 8:00 a. m. a 5:00 p. m.
          </span>
        </div>
        <div className="relative min-h-[360px] flex-[1.3_1_520px] self-stretch bg-hs-placeholder md:min-h-[600px]">
          <Image
            src={HERO_IMAGE}
            alt="Walk-in closet a medida diseñado y fabricado por Habita Studio"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover object-[center_35%]"
          />
        </div>
      </Container>

      {/* 2. Trust strip */}
      <section className="border-y border-hs-border bg-white">
        <Container className="grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-4 md:gap-8 md:py-9">
          {TRUST.map((t) => (
            <div key={t.title} className="flex flex-col gap-1">
              <span className="font-display text-2xl font-semibold leading-[1.15] md:text-[30px]">
                {t.title}
              </span>
              <span className="text-[13px] text-hs-muted md:text-sm">{t.text}</span>
            </div>
          ))}
        </Container>
      </section>

      {/* 3. Explora por espacio */}
      {productCategories.length > 0 && (
      <Container as="section" className={SECTION}>
        <SectionHeader
          eyebrow="Catálogo"
          title="Explora por espacio"
          linkLabel="Ver catálogo completo"
          linkHref="/catalogo"
        />
        <div className={`mt-5 grid grid-cols-2 gap-3 md:mt-10 ${gridCols} md:gap-6`}>
          {categories.map((c) => (
            <CategoryTile key={c.name} {...c} />
          ))}
        </div>
      </Container>
      )}

      {/* 4. Productos destacados */}
      {featuredProducts.length > 0 && (
        <Container as="section" className={SECTION}>
          <SectionHeader
            eyebrow="Selección"
            title="Productos destacados"
            linkLabel="Ver todos los productos"
            linkHref="/catalogo"
          />
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5 md:mt-10 md:grid-cols-4 md:gap-6">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                featured
                slug={p.slug}
                name={p.name}
                category={p.category}
                image={p.image}
                dimensions={p.specifications?.dimensions}
                material={p.specifications?.material}
                price={p.price}
              />
            ))}
          </div>
          <p className="mt-6 text-[13px] text-hs-muted">
            Precios de referencia. Confirma el precio final en tu cotización.
          </p>
        </Container>
      )}

      {/* 5. Servicios */}
      <Container as="section" className="flex flex-wrap gap-8 pt-14 md:gap-16 md:pt-[120px]">
        <div className="flex flex-[1_1_340px] flex-col gap-5">
          <Eyebrow>Servicios</Eyebrow>
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[46px]">
            Soluciones integrales para tu hogar o negocio
          </h2>
          <p className="text-hs-muted">
            Del diseño a la instalación: un solo equipo se encarga de todo el proyecto.
          </p>
          <Link href="/servicios" className={LINK + " self-start"}>
            Ver todos los servicios →
          </Link>
        </div>
        <ol className="grid flex-[2_1_560px] grid-cols-1 border-t border-hs-rule sm:grid-cols-2">
          {SERVICES.map((s, i) => (
            <li
              key={s.title}
              className="flex flex-col gap-2 border-b border-hs-rule py-5 pr-7 md:pb-8 md:pt-7"
            >
              <span className="text-[13px] font-semibold text-hs-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-[19px] font-semibold">{s.title}</h3>
              <p className="text-[15px] text-hs-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* 6. Cómo trabajamos */}
      <section className="mt-14 border-y border-hs-border bg-white md:mt-[120px]">
        <Container className="flex flex-col gap-8 py-10 md:gap-12 md:py-[88px]">
          <div className="flex max-w-[640px] flex-col gap-3">
            <Eyebrow>Cómo trabajamos</Eyebrow>
            <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[46px]">
              De la idea a la instalación, en cuatro pasos
            </h2>
          </div>
          <ProcessSteps />
        </Container>
      </section>

      {/* 7. Proyecto destacado */}
      {featuredProject && (
        <Container
          as="section"
          className="flex flex-wrap items-center gap-6 pt-14 md:gap-14 md:pt-[120px]"
        >
          <div className="relative min-h-[300px] flex-[1.4_1_520px] self-stretch bg-hs-placeholder md:min-h-[520px]">
            {featuredProject.image ? (
              <Image
                src={featuredProject.image}
                alt={featuredProject.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <ImagePlaceholder label="Proyecto" />
            )}
          </div>
          <div className="flex flex-[1_1_360px] flex-col gap-5">
            <Eyebrow>Proyecto destacado</Eyebrow>
            <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
              {featuredProject.title}
            </h2>
            {featuredProject.description && (
              <p className="text-hs-muted">{featuredProject.description}</p>
            )}
            <SpecList
              rows={[
                { label: "Sector", value: featuredProject.category },
                { label: "Ubicación", value: featuredProject.location },
                { label: "Duración", value: featuredProject.duration },
                { label: "Año", value: featuredProject.year },
              ]}
            />
            <Link href="/proyectos" className={LINK + " self-start"}>
              Ver todos los proyectos →
            </Link>
          </div>
        </Container>
      )}

      {/* 8. Testimonios */}
      <Container as="section" className="flex flex-col gap-6 py-14 md:gap-10 md:py-[120px]">
        <div className="flex flex-col gap-3">
          <Eyebrow>Clientes</Eyebrow>
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[46px]">
            Lo que dicen nuestros clientes
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </Container>

      {/* 9. CTA */}
      <CTABand />
    </>
  );
}
