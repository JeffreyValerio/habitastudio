import Link from "next/link";
import { Container } from "@/components/site/container";
import { categoryHref, type CatalogCategory } from "@/lib/catalog-categories";

const empresa = [
  { name: "Sobre nosotros", href: "/sobre-nosotros" },
  { name: "Servicios", href: "/servicios" },
  { name: "Proyectos", href: "/proyectos" },
  // Blog oculto hasta tener artículos reales: { name: "Blog", href: "/blog" },
];
const legal = [
  { name: "Política de privacidad", href: "/politica-privacidad" },
  { name: "Términos y condiciones", href: "/terminos-condiciones" },
  { name: "Cookies", href: "/cookies" },
];
const social = [
  { name: "Instagram", href: "https://instagram.com/habitastudio" },
  { name: "Facebook", href: "https://facebook.com/habitastudio" },
  { name: "LinkedIn", href: "https://linkedin.com/company/habitastudio" },
];

const link =
  "text-hs-onDarkText hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-onDark";
const colTitle =
  "text-xs font-semibold uppercase tracking-[0.14em] text-hs-footerMuted";

export function Footer({ categories = [] }: { categories?: CatalogCategory[] }) {
  const productos = [
    ...categories.map((c) => ({ name: c.label, href: categoryHref(c.value) })),
    { name: "Ver catálogo", href: "/catalogo" },
  ];
  // Extra bottom padding on mobile so the fixed action bar never covers content.
  return (
    <footer className="bg-hs-text text-sm leading-relaxed text-hs-onDarkText">
      <Container className="flex flex-col gap-10 pb-28 pt-12 md:gap-14 md:pb-10 md:pt-[72px]">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2 flex min-w-0 flex-col gap-4">
            <Link href="/" className="block w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-onDark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-horizontal-oscuro.svg"
                alt="Habita Studio"
                width={467}
                height={137}
                className="h-12 w-auto md:h-14"
              />
            </Link>
            <p className="max-w-[380px] text-hs-footerMuted">
              Transformamos espacios con muebles de calidad y remodelaciones
              profesionales. Diseño elegante y funcional para tu hogar o negocio.
            </p>
            <ul className="flex flex-wrap gap-x-5">
              {social.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link} inline-flex min-h-[44px] items-center`}
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Empresa" className="flex flex-col gap-1">
            <span className={`${colTitle} pb-2`}>Empresa</span>
            {empresa.map((l) => (
              <Link key={l.href} href={l.href} className={`${link} inline-flex min-h-[32px] items-center`}>
                {l.name}
              </Link>
            ))}
          </nav>

          <nav aria-label="Productos" className="flex flex-col gap-1">
            <span className={`${colTitle} pb-2`}>Productos</span>
            {productos.map((l) => (
              <Link key={l.name} href={l.href} className={`${link} inline-flex min-h-[32px] items-center`}>
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="col-span-2 flex flex-col gap-1 lg:col-span-1">
            <span className={`${colTitle} pb-2`}>Contacto</span>
            <a href="tel:+50663644915" data-track-location="footer" className={`${link} inline-flex min-h-[32px] items-center`}>
              +506 6364 4915
            </a>
            <a href="mailto:info@habitastudio.online" data-track-location="footer" className={`${link} inline-flex min-h-[32px] items-center`}>
              info@habitastudio.online
            </a>
            <span>San José, Costa Rica</span>
            <span className="text-hs-footerMuted">Lun a vie, 8:00 a. m. a 5:00 p. m.</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-hs-darkRule pt-6 text-[13px] text-hs-footerMuted">
          <span>© 2026 Habita Studio. Todos los derechos reservados.</span>
          <ul className="flex flex-wrap gap-x-5">
            {legal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-[32px] items-center text-hs-footerMuted hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-onDark"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
