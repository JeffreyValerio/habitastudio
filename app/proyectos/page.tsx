import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";
import { SpecList } from "@/components/site/spec-list";
import { CTABand } from "@/components/site/cta-band";
import { ImagePlaceholder } from "@/components/site/image-placeholder";
import { getProjects, pickFeaturedProject } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Proyectos de Muebles y Remodelación",
  description: "Mira proyectos reales de muebles a medida y remodelaciones en Costa Rica: cocinas, closets y espacios transformados por Habita Studio.",
  alternates: { canonical: "/proyectos" },
};

const CRUMB =
  "underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";
const LINK =
  "inline-flex min-h-[44px] items-center text-[15px] font-medium text-hs-accent underline underline-offset-4 hover:text-hs-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

const FIGURES = [
  { value: "2010", label: "Año de inicio" },
  { value: "Cientos", label: "de proyectos entregados" },
];

export default async function ProjectsPage() {
  const projects = await getProjects();
  const featured = pickFeaturedProject(projects);
  const others = projects.filter((p) => p.id !== featured?.id);

  return (
    <>
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          / <span aria-current="page">Proyectos</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6 md:gap-10">
          <div className="flex max-w-[640px] flex-col gap-4">
            <h1 className="font-display text-[40px] font-medium leading-[1.05] text-hs-text md:text-[60px]">
              Proyectos realizados
            </h1>
            <p className="text-base text-hs-muted md:text-lg">
              Descubre algunos de nuestros trabajos más destacados, desde hogares hasta
              espacios comerciales y de salud.
            </p>
          </div>
          <div className="flex gap-8">
            {FIGURES.map((f) => (
              <div key={f.value} className="flex flex-col gap-1">
                <span className="font-display text-[30px] font-semibold leading-[1.1] md:text-5xl">
                  {f.value}
                </span>
                <span className="text-[13px] text-hs-muted">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {projects.length === 0 && (
        <Container as="section" className="flex flex-col items-start gap-5 pt-14 md:pt-[88px]">
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
            Pronto publicaremos nuevos proyectos
          </h2>
          <p className="max-w-[520px] text-hs-muted">
            Mientras tanto, cuéntanos qué tienes en mente y te asesoramos sin compromiso.
          </p>
          <SiteButtonLink href="/contacto">Solicitar cotización</SiteButtonLink>
        </Container>
      )}

      {featured && (
        <Container as="section" className="pt-8 md:pt-12">
          <div className="flex flex-wrap border border-hs-border bg-hs-surface">
            <div className="relative min-h-[260px] flex-[1.4_1_480px] self-stretch bg-hs-placeholder md:min-h-[480px]">
              {featured.image ? (
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              ) : (
                <ImagePlaceholder label="Proyecto" />
              )}
            </div>
            <div className="flex flex-[1_1_360px] flex-col justify-center gap-5 p-6 md:p-10">
              <Eyebrow>Caso destacado</Eyebrow>
              <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
                {featured.title}
              </h2>
              {featured.description && (
                <p className="line-clamp-4 text-hs-muted">{featured.description}</p>
              )}
              <SpecList
                rows={[
                  { label: "Sector", value: featured.category },
                  { label: "Ubicación", value: featured.location },
                  { label: "Duración", value: featured.duration },
                  { label: "Año", value: featured.year },
                ]}
              />
              <Link href={`/proyectos/${featured.slug}`} className={LINK + " self-start"}>
                Ver proyecto →
              </Link>
            </div>
          </div>
        </Container>
      )}

      {others.length > 0 && (
        <Container as="section" className="pt-14 md:pt-[88px]">
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
            Más proyectos
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 md:mt-10 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] md:gap-y-10">
            {others.map((p) => (
              <Link
                key={p.id}
                href={`/proyectos/${p.slug}`}
                className="group flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hs-accent"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-hs-placeholder">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImagePlaceholder label="Proyecto" />
                  )}
                </div>
                <span className="text-xs uppercase tracking-[0.1em] text-hs-muted">
                  {[p.category, p.year].filter(Boolean).join(" · ")}
                </span>
                <h3 className="text-[19px] font-semibold leading-snug text-hs-text group-hover:underline group-hover:underline-offset-4">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="line-clamp-3 text-[15px] text-hs-muted">{p.description}</p>
                )}
              </Link>
            ))}
          </div>
        </Container>
      )}

      <div className="mt-14 md:mt-[104px]">
        <CTABand
          title="¿Tienes un proyecto en mente?"
          text="Hogares, oficinas, comercios o espacios de salud. Cuéntanos qué necesitas."
        />
      </div>
    </>
  );
}
