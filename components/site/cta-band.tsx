import { Container } from "./container";
import { SiteButtonLink } from "./site-button";
import { SITE_CONFIG } from "@/lib/site-config";

export function CTABand({
  title = "¿Listo para transformar tu espacio?",
  text = "Contáctanos hoy y recibe una cotización gratuita para tu proyecto. Estamos aquí para hacer realidad tus ideas.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-hs-text text-hs-bg">
      <Container className="flex flex-wrap items-center justify-between gap-8 py-11 md:py-[88px]">
        <div className="flex max-w-[620px] flex-col gap-3">
          <h2 className="font-display text-[32px] font-medium leading-[1.1] md:text-[46px]">
            {title}
          </h2>
          <p className="text-base text-hs-onDarkMuted md:text-[17px]">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <SiteButtonLink
            href="/contacto"
            variant="onDark"
            data-track-quote
            data-track-location="cta_band"
          >
            Solicitar cotización
          </SiteButtonLink>
          <SiteButtonLink
            href={SITE_CONFIG.whatsappUrl}
            data-track-location="cta_band"
            target="_blank"
            rel="noopener noreferrer"
            variant="onDarkOutline"
          >
            Escribir por WhatsApp
          </SiteButtonLink>
        </div>
      </Container>
    </section>
  );
}
