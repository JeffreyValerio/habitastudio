import { firstSentence } from "@/lib/site-url";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";
import { CTABand } from "@/components/site/cta-band";
import { ImagePlaceholder } from "@/components/site/image-placeholder";
import { SITE_CONFIG } from "@/lib/site-config";
import { getServiceBySlug, getAllServiceSlugs } from "@/lib/data/services";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Servicio no encontrado",
    };
  }

  return {
    title: service.title,
    description: firstSentence(service.description) || undefined,
    alternates: { canonical: `/servicios/${service.slug ?? slug}` },
    openGraph: {
      url: `/servicios/${service.slug ?? slug}`,
      title: service.title,
      description: service.description,
      images: service.image ? [service.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: service.title,
      description: service.description,
      images: service.image ? [service.image] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

const CRUMB =
  "underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

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

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const clean = (a?: string[]) => (a ?? []).filter((x) => x.trim() !== "");
  const features = clean(service.features);
  const process = clean(service.process);
  const benefits = clean(service.benefits);
  const asunto = `/contacto?asunto=${encodeURIComponent(service.title)}`;

  return (
    <>
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          /{" "}
          <Link href="/servicios" className={CRUMB}>
            Servicios
          </Link>{" "}
          / <span aria-current="page">{service.title}</span>
        </nav>

        <div className="mt-6 flex flex-wrap gap-8 md:mt-8 md:gap-14">
          <div className="relative aspect-[4/3] min-w-0 flex-[1.3_1_520px] self-start overflow-hidden bg-hs-placeholder">
            {service.image ? (
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Eyebrow>Servicio</Eyebrow>
              <h1 className="font-display text-[38px] font-medium leading-[1.05] text-hs-text md:text-[52px]">
                {service.title}
              </h1>
            </div>
            {service.description && (
              <p className="whitespace-pre-line text-base leading-[1.6] text-hs-text2">
                {service.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <SiteButtonLink
                href={asunto}
                data-track-quote
                data-track-location="service_detail"
                data-track-product={service.title}
              >
                Cotizar este servicio
              </SiteButtonLink>
              <SiteButtonLink
                href={SITE_CONFIG.whatsappUrl}
                data-track-location="service_detail"
                data-track-product={service.title}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                Consultar por WhatsApp
              </SiteButtonLink>
            </div>
          </div>
        </div>
      </Container>

      {service.longDescription && service.longDescription.trim() !== "" && (
        <Container as="section" className="pt-14 md:pt-[88px]">
          <div className="flex max-w-[760px] flex-col gap-4">
            <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
              Sobre este servicio
            </h2>
            <p className="whitespace-pre-line text-base leading-[1.7] text-hs-text2 md:text-[17px]">
              {service.longDescription}
            </p>
          </div>
        </Container>
      )}

      {(features.length > 0 || benefits.length > 0) && (
        <Container as="section" className="flex flex-wrap gap-8 pt-14 md:gap-14 md:pt-[88px]">
          {features.length > 0 && <BulletList title="Características principales" items={features} />}
          {benefits.length > 0 && <BulletList title="Beneficios" items={benefits} />}
        </Container>
      )}

      {process.length > 0 && (
        <Container as="section" className="flex flex-col gap-8 pt-14 md:pt-[88px]">
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[42px]">
            Nuestro proceso
          </h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <li key={i} className="flex flex-col gap-2.5 border-t-2 border-hs-text pt-5">
                <span className="font-display text-4xl font-semibold leading-none">{i + 1}</span>
                <p className="text-[15px] text-hs-text2">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      )}

      <div className="mt-14 md:mt-[104px]">
        <CTABand
          title="¿Listo para comenzar?"
          text="Contáctanos hoy y recibe una cotización gratuita para tu proyecto."
        />
      </div>
    </>
  );
}
