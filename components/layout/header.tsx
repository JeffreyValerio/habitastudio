"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { GlobalSearch } from "@/components/search/global-search";
import { Container } from "@/components/site/container";
import { SiteButtonLink } from "@/components/site/site-button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Catálogo", href: "/catalogo" },
  { name: "Proyectos", href: "/proyectos" },
  { name: "Servicios", href: "/servicios" },
  { name: "Nosotros", href: "/sobre-nosotros" },
  // Blog oculto hasta tener artículos reales: { name: "Blog", href: "/blog" },
  { name: "Contacto", href: "/contacto" },
];

const WHATSAPP_URL = "https://wa.me/50663644915";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark() {
  return (
    <Link href="/" className={cn("block shrink-0", focusRing)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-horizontal-color.svg"
        alt="Habita Studio"
        width={467}
        height={137}
        className="h-10 w-auto md:h-12"
      />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const iconButton = cn(
    "flex h-11 w-11 items-center justify-center border border-hs-input bg-hs-surface text-hs-text",
    focusRing
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hs-border bg-hs-bg text-hs-text">
      <div className="hidden bg-hs-text text-[13px] text-hs-onDarkText md:block">
        <Container className="flex flex-wrap justify-between gap-x-6 gap-y-2 py-[9px]">
          <span>San José, Costa Rica · Lunes a viernes, 8:00 a. m. a 5:00 p. m.</span>
          <div className="flex flex-wrap gap-5">
            {[
              { label: "+506 6364 4915", href: "tel:+50663644915" },
              { label: "info@habitastudio.online", href: "mailto:info@habitastudio.online" },
              { label: "WhatsApp", href: WHATSAPP_URL },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                data-track-location="header_topbar"
                {...(c.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-onDark"
              >
                {c.label}
              </a>
            ))}
          </div>
        </Container>
      </div>

      <Container className="flex items-center justify-between gap-4 py-3.5 md:py-[22px] lg:gap-10">
        <Wordmark />

        <nav aria-label="Principal" className="hidden flex-wrap items-center gap-x-5 text-[15px] lg:flex xl:gap-x-7">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 py-2.5",
                  focusRing,
                  active
                    ? "border-hs-accent font-semibold text-hs-text"
                    : "border-transparent text-hs-text2 hover:text-hs-text"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            className={iconButton}
            aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </button>
          <SiteButtonLink
            href="/contacto"
            data-track-quote
            data-track-location="header"
            className="min-h-[44px] px-[22px] text-sm"
          >
            Solicitar cotización
          </SiteButtonLink>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className={iconButton}
            aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {searchOpen && (
        <div className="border-t border-hs-border bg-hs-bg">
          <Container className="py-4">
            <GlobalSearch />
          </Container>
        </div>
      )}

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Menú móvil"
          className="border-t border-hs-border bg-hs-bg lg:hidden"
        >
          <Container className="flex flex-col py-2">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-h-[48px] items-center border-b border-hs-border text-base",
                    focusRing,
                    active ? "font-semibold text-hs-accent" : "text-hs-text2"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
            <div className="py-4">
              <SiteButtonLink
                href="/contacto"
                data-track-quote
                data-track-location="header_mobile_menu"
                onClick={() => setMenuOpen(false)}
                className="w-full"
              >
                Solicitar cotización
              </SiteButtonLink>
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
