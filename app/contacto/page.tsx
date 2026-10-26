import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { SiteButtonLink } from "@/components/site/site-button";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contacto y Cotización Gratis",
  description: "Solicita tu cotización gratis de muebles a medida o remodelación en Costa Rica. Escríbenos por formulario, WhatsApp, teléfono o email.",
  alternates: { canonical: "/contacto" },
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";
const CRUMB = `underline underline-offset-2 hover:text-hs-text ${FOCUS}`;
const DATA_LINK = `inline-flex min-h-[44px] items-center text-[17px] text-hs-text hover:text-hs-accent ${FOCUS}`;
const DT = "text-xs uppercase tracking-[0.1em] text-hs-muted";

export default function ContactPage() {
  return (
    <>
      <Container className="flex flex-col gap-4 pb-10 pt-6 md:pb-12 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          / <span aria-current="page">Contacto</span>
        </nav>
        <Eyebrow className="mt-2">Contacto</Eyebrow>
        <h1 className="font-display text-[40px] font-medium leading-[1.05] text-hs-text md:text-[60px]">
          Contáctanos
        </h1>
        <p className="max-w-[620px] text-base text-hs-muted md:text-lg">
          Estamos aquí para ayudarte a transformar tus espacios. Escríbenos y te enviamos una
          cotización gratuita.
        </p>
      </Container>

      <Container className="flex flex-wrap items-start gap-8 pb-16 md:gap-10 md:pb-24">
        <div className="flex min-w-0 flex-[1.3_1_520px] flex-col gap-6 border border-hs-border bg-hs-surface p-5 md:p-9">
          <h2 className="font-display text-[28px] font-medium leading-[1.15] text-hs-text md:text-[34px]">
            Envíanos un mensaje
          </h2>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>

        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
          <div className="flex flex-col gap-5 bg-hs-text p-6 text-hs-onDark md:p-10">
            <h2 className="font-display text-[26px] font-medium leading-[1.15] md:text-[30px]">
              ¿Prefieres escribirnos ya?
            </h2>
            <p className="text-[15px] text-hs-onDarkMuted">
              Respuesta directa por WhatsApp en horario de oficina.
            </p>
            <SiteButtonLink
              href={SITE_CONFIG.whatsappUrl}
              data-track-location="contact_aside"
              target="_blank"
              rel="noopener noreferrer"
              variant="onDark"
            >
              Escribir por WhatsApp
            </SiteButtonLink>
          </div>

          <dl className="border border-hs-border bg-hs-surface px-6 py-2 md:px-10">
            <div className="flex flex-col border-b border-hs-border py-3.5">
              <dt className={DT}>Teléfono</dt>
              <dd>
                <a href={SITE_CONFIG.phoneHref} className={DATA_LINK}>
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </dd>
            </div>
            <div className="flex flex-col border-b border-hs-border py-3.5">
              <dt className={DT}>Correo</dt>
              <dd>
                <a href={SITE_CONFIG.emailHref} className={`${DATA_LINK} break-all`}>
                  {SITE_CONFIG.email}
                </a>
              </dd>
            </div>
            <div className="flex flex-col border-b border-hs-border py-3.5">
              <dt className={DT}>Dirección</dt>
              <dd className="text-[17px] text-hs-text">San José, Costa Rica</dd>
            </div>
            <div className="flex flex-col py-3.5">
              <dt className={DT}>Horario</dt>
              <dd className="text-[17px] text-hs-text">
                Lunes a viernes, 8:00 a. m. a 5:00 p. m.
              </dd>
            </div>
          </dl>
        </aside>
      </Container>
    </>
  );
}
