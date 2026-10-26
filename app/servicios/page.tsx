import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getServices } from "@/lib/data/services";
import { groupServices } from "@/lib/service-groups";
import { SITE_CONFIG } from "@/lib/site-config";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";
import { ProcessSteps } from "@/components/site/process-steps";
import { CTABand } from "@/components/site/cta-band";
import { ImagePlaceholder } from "@/components/site/image-placeholder";

export const metadata: Metadata = {
  title: "Servicios de Diseño y Remodelación",
  description: "Diseño de interiores, remodelaciones y muebles a medida en Costa Rica. Conoce cómo trabajamos, de la asesoría a la entrega.",
  alternates: { canonical: "/servicios" },
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";
const CRUMB = `underline underline-offset-2 hover:text-hs-text ${FOCUS}`;
const LINK = `inline-flex min-h-[44px] items-center text-sm font-medium text-hs-accent underline underline-offset-4 hover:text-hs-accentHover ${FOCUS}`;

const STEPS = [
  { title: "Asesoría", text: "Conversamos sobre tu espacio, tus necesidades y tu presupuesto." },
  { title: "Diseño y cotización", text: "Te presentamos la propuesta con medidas, materiales y precio." },
  { title: "Fabricación y obra", text: "Fabricamos y ejecutamos con materiales de primera." },
  { title: "Entrega", text: "Instalamos y entregamos en el plazo acordado." },
];

export default async function ServicesPage() {
  const services = await getServices();
  const groups = groupServices(services);
  const heroImage = services.find((s) => s.image)?.image ?? null;

  return (
    <>
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          / <span aria-current="page">Servicios</span>
        </nav>
        <div className="mt-6 flex flex-wrap items-center gap-8 md:gap-14">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Eyebrow>Servicios</Eyebrow>
              <h1 className="font-display text-[40px] font-medium leading-[1.05] text-hs-text md:text-[60px]">
                Soluciones integrales para transformar tus espacios
              </h1>
              <p className="text-base text-hs-muted md:text-lg">
                Diseño de interiores, remodelaciones, muebles a medida y asesoría profesional.
                Un solo equipo, del plano a la instalación.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SiteButtonLink href="/contacto" data-track-quote data-track-location="services_page">
                Solicitar cotización
              </SiteButtonLink>
              <SiteButtonLink
                href={SITE_CONFIG.whatsappUrl}
                data-track-location="services_page"
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                Consultar por WhatsApp
              </SiteButtonLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] min-w-0 flex-[1_1_420px] overflow-hidden bg-hs-placeholder md:aspect-[16/10]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="Servicios de Habita Studio"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>
      </Container>

      {groups.length === 0 && (
        <Container as="section" className="pt-14 md:pt-[88px]">
          <p className="max-w-[520px] text-hs-muted">
            Pronto publicaremos nuestros servicios. Mientras tanto, cuéntanos qué necesitas y te
            asesoramos sin compromiso.
          </p>
        </Container>
      )}

      <div className="mt-12 md:mt-[72px]">
        {groups.map((group, gi) => (
          <section key={group.key} className="border-t border-hs-rule">
            <Container className="flex flex-wrap gap-8 py-10 md:gap-14 md:py-14">
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2 md:max-w-[340px]">
                <span className="font-sans text-xs font-semibold tracking-[0.14em] text-hs-accent">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-[32px] font-medium leading-[1.1] text-hs-text md:text-[36px]">
                  {group.title}
                </h2>
                <p className="text-[15px] text-hs-muted">{group.intro}</p>
              </div>
              <ul className="grid min-w-0 flex-[3_1_480px] content-start gap-4 sm:grid-cols-2">
                {group.services.map((s) => {
                  const href = `/contacto?asunto=${encodeURIComponent(s.title)}`;
                  return (
                    <li
                      key={s.slug}
                      className="flex flex-col gap-2 border border-hs-border bg-hs-surface p-6 md:p-7"
                    >
                      <h3 className="text-[19px] font-semibold leading-snug text-hs-text">
                        <Link
                          href={`/servicios/${s.slug}`}
                          className={`hover:text-hs-accent ${FOCUS}`}
                        >
                          {s.title}
                        </Link>
                      </h3>
                      <p className="text-[15px] text-hs-muted">{s.description}</p>
                      <Link
                        href={href}
                        data-track-quote
                        data-track-location="services_list"
                        data-track-product={s.title}
                        className={`${LINK} mt-auto`}
                      >
                        Cotizar este servicio →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </section>
        ))}
      </div>

      <section className="border-y border-hs-border bg-hs-surface">
        <Container className="flex flex-col gap-10 py-14 md:py-[88px]">
          <div className="flex flex-col gap-3">
            <Eyebrow>Proceso</Eyebrow>
            <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[46px]">
              Te acompañamos en cada paso
            </h2>
          </div>
          <ProcessSteps steps={STEPS} />
        </Container>
      </section>

      <CTABand
        title="Recibe una cotización gratuita"
        text="Cuéntanos qué servicio necesitas y te respondemos en horario de oficina."
      />
    </>
  );
}
