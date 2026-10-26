import { firstSentence } from "@/lib/site-url";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getAllProjectSlugs } from "@/lib/data/projects";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SpecList } from "@/components/site/spec-list";
import { CTABand } from "@/components/site/cta-band";

const CRUMB =
  "underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Proyecto no encontrado",
    };
  }

  return {
    title: project.title,
    description: firstSentence(project.description) || undefined,
    alternates: { canonical: `/proyectos/${project.slug ?? slug}` },
    openGraph: {
      url: `/proyectos/${project.slug ?? slug}`,
      title: project.title,
      description: project.description,
      images: [
        {
          url: project.image,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [project.image],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
      <h2 className="font-display text-[28px] font-medium leading-[1.1] md:text-[34px]">{title}</h2>
      <ul className="flex flex-col gap-2 border-t border-hs-rule pt-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[15px] text-hs-text2">
            <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 bg-hs-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const challenges = (project.challenges ?? []).filter((c) => c.trim() !== "");
  const solutions = (project.solutions ?? []).filter((s) => s.trim() !== "");

  return (
    <>
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          /{" "}
          <Link href="/proyectos" className={CRUMB}>
            Proyectos
          </Link>{" "}
          / <span aria-current="page">{project.title}</span>
        </nav>

        <div className="mt-6 flex flex-wrap gap-8 md:mt-8 md:gap-14">
          <div className="min-w-0 flex-[1.3_1_520px]">
            <ProductGallery
              image={project.image}
              gallery={project.gallery || []}
              name={project.title}
              aspect="video"
              fit="contain"
            />
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Eyebrow>{project.category}</Eyebrow>
              <h1 className="font-display text-[38px] font-medium leading-[1.05] text-hs-text md:text-[52px]">
                {project.title}
              </h1>
            </div>
            {project.description && (
              <p className="whitespace-pre-line text-base leading-[1.6] text-hs-text2">
                {project.description}
              </p>
            )}
            <SpecList
              rows={[
                { label: "Sector", value: project.category },
                { label: "Ubicación", value: project.location },
                { label: "Duración", value: project.duration },
                { label: "Año", value: project.year },
              ]}
            />
          </div>
        </div>
      </Container>

      {project.longDescription && project.longDescription.trim() !== "" && (
        <Container as="section" className="pt-14 md:pt-[88px]">
          <div className="flex max-w-[760px] flex-col gap-4">
            <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
              Sobre el proyecto
            </h2>
            <p className="whitespace-pre-line text-base leading-[1.7] text-hs-text2 md:text-[17px]">
              {project.longDescription}
            </p>
          </div>
        </Container>
      )}

      {(challenges.length > 0 || solutions.length > 0) && (
        <Container as="section" className="flex flex-wrap gap-8 pt-14 md:gap-14 md:pt-[88px]">
          {challenges.length > 0 && <BulletList title="Desafíos" items={challenges} />}
          {solutions.length > 0 && <BulletList title="Soluciones" items={solutions} />}
        </Container>
      )}

      <div className="mt-14 md:mt-[104px]">
        <CTABand
          title="¿Te gusta este proyecto?"
          text="Contáctanos para conversar cómo podemos crear algo similar para ti."
        />
      </div>
    </>
  );
}
