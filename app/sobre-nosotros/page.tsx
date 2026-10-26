import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { CTABand } from "@/components/site/cta-band";
import { ImagePlaceholder } from "@/components/site/image-placeholder";

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description: "Conoce a Habita Studio: desde 2010 diseñamos y fabricamos muebles a medida y remodelaciones en Costa Rica, con materiales de calidad.",
  alternates: { canonical: "/sobre-nosotros" },
};

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";
const CRUMB = `underline underline-offset-2 hover:text-hs-text ${FOCUS}`;

const FIGURES = [
  { value: "2010", label: "Año de fundación" },
  { value: "+10 años", label: "de experiencia" },
  { value: "Cientos", label: "de proyectos completados" },
  { value: "A medida", label: "muebles y remodelaciones personalizados" },
];

const VALUES = [
  {
    title: "Calidad",
    description: "Trabajamos solo con materiales de primera calidad y proveedores certificados.",
  },
  {
    title: "Equipo experto",
    description: "Nuestro equipo está formado por profesionales con años de experiencia.",
  },
  {
    title: "Puntualidad",
    description: "Cumplimos con los plazos acordados sin comprometer la calidad del trabajo.",
  },
  {
    title: "Satisfacción",
    description: "La satisfacción del cliente es nuestra máxima prioridad en cada proyecto.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Container className="pt-6 md:pt-12">
        <nav aria-label="Migas de pan" className="text-[13px] text-hs-muted">
          <Link href="/" className={CRUMB}>
            Inicio
          </Link>{" "}
          / <span aria-current="page">Sobre nosotros</span>
        </nav>
        <div className="mt-6 flex max-w-[820px] flex-col gap-4">
          <Eyebrow>Sobre nosotros</Eyebrow>
          <h1 className="font-display text-[42px] font-medium leading-[1.02] text-hs-text md:text-[72px]">
            Transformando espacios desde 2010
          </h1>
          <p className="text-base text-hs-muted md:text-lg">
            Diseño de interiores, muebles personalizados y remodelaciones completas, con un equipo
            comprometido con cada detalle.
          </p>
        </div>
        <div className="relative mt-10 aspect-[4/3] overflow-hidden bg-hs-placeholder md:mt-14 md:aspect-[21/9]">
          <ImagePlaceholder label="Nuestro taller" />
        </div>
      </Container>

      <Container as="section" className="flex flex-wrap gap-8 py-14 md:gap-14 md:py-[88px]">
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
          <Eyebrow>Nuestra historia</Eyebrow>
          <h2 className="font-display text-[32px] font-medium leading-[1.1] text-hs-text md:text-[46px]">
            Funcionalidad, elegancia y calidad
          </h2>
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 text-base text-hs-text2 md:text-[17px]">
          <p>
            Habita Studio nació con la visión de crear espacios que combinen funcionalidad,
            elegancia y calidad. Desde nuestros inicios, nos hemos especializado en el diseño de
            interiores, fabricación de muebles personalizados y remodelaciones completas.
          </p>
          <p>
            Con más de una década de experiencia, hemos completado cientos de proyectos exitosos,
            desde pequeños apartamentos hasta grandes espacios comerciales. Nuestro compromiso es
            ofrecer soluciones que superen las expectativas de nuestros clientes.
          </p>
        </div>
      </Container>

      <section className="border-y border-hs-border bg-hs-surface">
        <Container>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
            {FIGURES.map((f) => (
              <div key={f.value} className="flex flex-col gap-1">
                <dd className="order-1 text-sm text-hs-muted">{f.label}</dd>
                <dt className="font-display text-[36px] font-medium leading-none text-hs-text md:text-[48px]">
                  {f.value}
                </dt>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container as="section" className="flex flex-col gap-10 py-14 md:py-[88px]">
        <div className="flex flex-col gap-3">
          <Eyebrow>Valores</Eyebrow>
          <h2 className="font-display text-[32px] font-medium leading-[1.1] text-hs-text md:text-[46px]">
            Lo que nos define
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v.title} className="flex flex-col gap-2 border border-hs-border bg-hs-surface p-6">
              <h3 className="text-[19px] font-semibold leading-snug text-hs-text">{v.title}</h3>
              <p className="text-[15px] text-hs-muted">{v.description}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="bg-hs-text text-hs-onDark">
        <Container className="flex flex-col gap-5 py-14 md:py-[88px]">
          <span className="block font-sans text-xs font-semibold uppercase tracking-[0.14em] text-hs-onDarkMuted">
            Nuestra misión
          </span>
          <p className="max-w-[900px] font-display text-[26px] font-medium leading-[1.3] md:text-[36px]">
            Transformar espacios habitables en lugares que inspiren, donde cada detalle refleje la
            personalidad y necesidades de quienes los habitan. Ofrecemos soluciones integrales que
            combinan diseño, funcionalidad y calidad, siempre con un servicio excepcional.
          </p>
        </Container>
      </section>

      <CTABand
        title="Hablemos de tu proyecto"
        text="Te asesoramos sin compromiso y te enviamos una cotización gratuita."
      />
    </>
  );
}
